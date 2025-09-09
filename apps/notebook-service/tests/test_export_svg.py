from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_export_handles_svg_output():
    svg = """
    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"50\"><rect width=\"100\" height=\"50\" fill=\"#0bf\"/></svg>
    """.strip()
    payload = {
        "title": "SVG Report",
        "format": "pdf",
        "content": [
            {
                "type": "notebook_code",
                "source": "display(svg)",
                "outputs": [{
                    "output_type": "display_data",
                    "data": {"image/svg+xml": svg},
                }],
                "origin": {"notebookName": "svg.ipynb", "cellIndex": 0},
            }
        ],
    }
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    assert job["status"] == "completed"
    # download pdf
    dl = client.get(job["downloadUrl"])  # type: ignore
    assert dl.status_code == 200
    assert dl.headers["content-type"].startswith("application/pdf")

