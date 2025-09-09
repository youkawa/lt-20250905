import io
import json
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def make_export_payload():
    return {
        "title": "Demo Report",
        "content": [
            {"type": "notebook_markdown", "source": "# Title", "origin": {"notebookName": "sample.ipynb", "cellIndex": 0}},
            {
                "type": "notebook_code",
                "source": "print('hi')",
                "outputs": [{"output_type": "stream", "text": "hi\n"}],
                "origin": {"notebookName": "sample.ipynb", "cellIndex": 1},
            },
        ],
        "metadata": {"projectId": "p1", "reportId": "r1", "author": "alice"},
    }


def test_export_e2e():
    payload = make_export_payload()
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    job_id = job["jobId"]
    # status should be done in this synchronous stub
    res2 = client.get(f"/export-jobs/{job_id}")
    assert res2.status_code == 200
    assert res2.json()["status"] in ("completed", "processing", "queued")
    # download
    res3 = client.get(f"/exports/{job_id}.pptx")
    assert res3.status_code == 200
    assert res3.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )
    # filename 提示（Content-Disposition）
    cd = res3.headers.get("content-disposition", "")
    assert "filename=" in cd
    assert client.get(f"/export-jobs/{job_id}").json().get("downloadUrl")
