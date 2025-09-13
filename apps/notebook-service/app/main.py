from __future__ import annotations
import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from .schemas import HealthResponse, ParseResponse
from .schemas_export import ExportRequest, ExportJob
from .services.parser import parse_ipynb_bytes
from .services.exporter import Exporter


APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
EXPORT_OUT_DIR = os.getenv("EXPORT_OUT_DIR", os.path.join(os.getcwd(), "exports"))

app = FastAPI(title="Notebook Service", version=APP_VERSION)
exporter = Exporter(EXPORT_OUT_DIR)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(version=APP_VERSION)


@app.post("/parse", response_model=ParseResponse)
async def parse(file: UploadFile = File(...)) -> ParseResponse:
    if not file.filename.endswith(".ipynb"):
        raise HTTPException(status_code=400, detail="Only .ipynb is supported")
    content = await file.read()
    try:
        cells = parse_ipynb_bytes(content, file.filename)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notebook file")
    return ParseResponse(name=file.filename, cells=cells)


@app.post("/export", response_model=ExportJob)
async def export(req: ExportRequest) -> ExportJob:
    job = exporter.create_job()
    try:
        # 同期実行（本番では背景ジョブに）
        exporter.run(job.jobId, req)
    except Exception as e:
        j = exporter.get_job(job.jobId)
        if j:
            j.status = "failed"
            j.error = f"failed: {e}"
        return j  # type: ignore
    return exporter.get_job(job.jobId)  # type: ignore


@app.get("/export-jobs/{job_id}", response_model=ExportJob)
def get_export_job(job_id: str) -> ExportJob:
    job = exporter.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/exports/{job_id}.pptx")
def download_export(job_id: str):
    path = os.path.join(EXPORT_OUT_DIR, f"{job_id}.pptx")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    # ダウンロード名にタイトル/プロジェクトID/日時を含める（URLはjobIdのまま）
    filename = f"report-{job_id}.pptx"
    try:
        meta = exporter.job_meta.get(job_id, {})
        title = meta.get("title") or "report"
        project_id = (meta.get("metadata") or {}).get("projectId")
        project_name = (meta.get("metadata") or {}).get("projectName")
        ts = os.path.getmtime(path)
        stamp = __import__("datetime").datetime.utcfromtimestamp(ts).strftime("%Y%m%d-%H%M%S")
        def slug(s: str) -> str:
            import re
            return re.sub(r"[^A-Za-z0-9_.-]+", "-", s).strip("-_.")[:60] or "report"
        base = slug(f"{(project_name or project_id) or 'project'}_{title}_{stamp}")
        filename = f"{base}.pptx"
    except Exception:
        pass
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename=filename,
    )


@app.get("/exports/{job_id}.pdf")
def download_export_pdf(job_id: str):
    path = os.path.join(EXPORT_OUT_DIR, f"{job_id}.pdf")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    # ダウンロード名はPPTXと同じ規則でベースを生成
    filename = f"report-{job_id}.pdf"
    try:
        meta = exporter.job_meta.get(job_id, {})
        title = meta.get("title") or "report"
        project_id = (meta.get("metadata") or {}).get("projectId")
        project_name = (meta.get("metadata") or {}).get("projectName")
        ts = os.path.getmtime(path)
        stamp = __import__("datetime").datetime.utcfromtimestamp(ts).strftime("%Y%m%d-%H%M%S")
        def slug(s: str) -> str:
            import re
            return re.sub(r"[^A-Za-z0-9_.-]+", "-", s).strip("-_.")[:60] or "report"
        base = slug(f"{(project_name or project_id) or 'project'}_{title}_{stamp}")
        filename = f"{base}.pdf"
    except Exception:
        pass
    return FileResponse(path, media_type="application/pdf", filename=filename)
