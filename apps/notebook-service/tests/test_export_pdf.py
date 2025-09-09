from fastapi.testclient import TestClient
from app.main import app
from PyPDF2 import PdfReader
import io


client = TestClient(app)


def test_export_pdf_with_bookmark():
    payload = {
        "title": "PDF Report",
        "format": "pdf",
        "content": [
            {"type": "text_box", "content": "エグゼクティブサマリー\n要点..."},
            {
                "type": "notebook_code",
                "source": "print('hi')",
                "outputs": [{"output_type": "stream", "text": "hi\n"}],
                "origin": {"notebookName": "sample.ipynb", "cellIndex": 1},
            },
        ],
        "metadata": {"projectId": "p1", "author": "alice"},
    }
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    assert job["status"] == "completed"
    assert job["downloadUrl"].endswith('.pdf')
    # download
    dl = client.get(job["downloadUrl"])  # type: ignore
    assert dl.status_code == 200
    assert dl.headers["content-type"].startswith("application/pdf")
    # check bookmark exists
    reader = PdfReader(io.BytesIO(dl.content))
    outlines = []
    try:
        for o in reader.outline:  # type: ignore[attr-defined]
            if isinstance(o, list):
                outlines.extend(o)
            else:
                outlines.append(o)
    except Exception:
        outlines = []
    # Expect an outline titled 'Executive Summary'
    titles = [getattr(o, 'title', '') for o in outlines]
    assert any('Executive Summary' in (t or '') for t in titles)

