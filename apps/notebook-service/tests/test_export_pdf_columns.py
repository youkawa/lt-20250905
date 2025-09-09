from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_pdf_two_columns_renders():
    payload = {
        "title": "Columns Report",
        "format": "pdf",
        "metadata": {"pdfStyle": {"columns": 2, "columnGap": 16}},
        "content": [
            {"type": "notebook_markdown", "source": "# Heading\n" + ("Lorem ipsum " * 50)},
        ],
    }
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    dl = client.get(job["downloadUrl"])  # type: ignore
    assert dl.status_code == 200
    assert dl.headers["content-type"].startswith("application/pdf")

