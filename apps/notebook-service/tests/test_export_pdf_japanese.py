from fastapi.testclient import TestClient
from app.main import app
from PyPDF2 import PdfReader
import io


client = TestClient(app)


def test_pdf_with_japanese_headings_generates_and_has_outline_titles():
    payload = {
        "title": "日本語レポート",
        "format": "pdf",
        "content": [
            {"type": "text_box", "content": "<h1>第1章 概要</h1>本文テキスト"},
            {"type": "notebook_markdown", "source": "## 第2章 詳細\n内容"},
        ],
    }
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    dl = client.get(job["downloadUrl"])  # type: ignore
    assert dl.status_code == 200
    reader = PdfReader(io.BytesIO(dl.content))
    try:
        outline = reader.outline  # type: ignore[attr-defined]
    except Exception:
        outline = []
    titles = [getattr(o, 'title', '') for o in (outline if isinstance(outline, list) else [outline])]
    assert any('第1章' in (t or '') for t in titles)
    assert any('第2章' in (t or '') for t in titles)

