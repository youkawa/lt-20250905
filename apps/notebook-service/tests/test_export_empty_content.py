from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_export_empty_content_success():
    payload = {"title": "Empty Report", "content": []}
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    assert job["status"] in ("completed", "processing")
    # download ok
    dl = client.get(job["downloadUrl"]).status_code
    assert dl == 200

