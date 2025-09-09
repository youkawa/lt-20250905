import io
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_parse_rejects_non_ipynb():
  files = {"file": ("sample.txt", io.BytesIO(b"not ipynb"), "text/plain")}
  res = client.post("/parse", files=files)
  assert res.status_code == 400
  assert 'Only .ipynb is supported' in res.json().get('detail', '')


def test_parse_broken_ipynb_returns_400():
  files = {"file": ("broken.ipynb", io.BytesIO(b"{not-json}"), "application/json")}
  res = client.post("/parse", files=files)
  assert res.status_code == 400
  assert 'Invalid notebook' in res.json().get('detail', '')
