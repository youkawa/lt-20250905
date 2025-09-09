import os
import tempfile
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_export_invalid_template_file():
    # Create a bogus file to simulate corrupted template
    fd, path = tempfile.mkstemp(suffix='.pptx')
    try:
        os.write(fd, b'NOT_A_PPTX')
        os.close(fd)
        payload = {"title": "Demo", "content": [], "templatePath": path}
        res = client.post("/export", json=payload)
        assert res.status_code == 200
        job = res.json()
        assert job["status"] == "failed"
        assert job.get("error")
    finally:
        try:
            os.remove(path)
        except OSError:
            pass

