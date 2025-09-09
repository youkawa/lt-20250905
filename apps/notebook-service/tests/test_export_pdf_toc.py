from fastapi.testclient import TestClient
from app.main import app
from PyPDF2 import PdfReader
import io


client = TestClient(app)


def test_pdf_has_toc_outline():
    payload = {
        "title": "TOC Report",
        "format": "pdf",
        "content": [
            {"type": "notebook_markdown", "source": "# Intro\ntext"},
            {"type": "notebook_markdown", "source": "# Method\ntext"},
        ],
    }
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    dl = client.get(job["downloadUrl"])  # type: ignore
    reader = PdfReader(io.BytesIO(dl.content))
    try:
        outline = reader.outline  # type: ignore[attr-defined]
    except Exception:
        outline = []
    titles = [getattr(o, 'title', '') for o in (outline if isinstance(outline, list) else [outline])]
    assert any('Table of Contents' in (t or '') for t in titles)

