from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_export_template_missing():
    payload = {
        "title": "Demo",
        "content": [],
        "templatePath": "/path/does/not/exist/template.pptx",
    }
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    assert job["status"] == "failed"
    assert any(x in (job.get("error") or "") for x in ["No such file", "not find", "not exist", "failed"])  # platform dependent

