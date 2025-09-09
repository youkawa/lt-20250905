from fastapi.testclient import TestClient
from app.main import app
from PyPDF2 import PdfReader
import io


client = TestClient(app)


def titles_from_outlines(reader: PdfReader) -> list[str]:
  titles = []
  try:
    outline = reader.outline  # type: ignore[attr-defined]
  except Exception:
    outline = []
  stack = outline if isinstance(outline, list) else [outline]
  for o in stack:
    t = getattr(o, 'title', None)
    if t:
      titles.append(t)
  return titles


def test_pdf_bookmarks_from_markdown_heading():
  payload = {
    "title": "PDF Report",
    "format": "pdf",
    "content": [
      {"type": "notebook_markdown", "source": "# Chapter 1\ntext"},
      {"type": "notebook_markdown", "source": "## Section A\nmore"},
    ],
  }
  res = client.post("/export", json=payload)
  assert res.status_code == 200
  job = res.json()
  dl = client.get(job["downloadUrl"])  # type: ignore
  reader = PdfReader(io.BytesIO(dl.content))
  titles = titles_from_outlines(reader)
  assert any('Chapter 1' in t for t in titles)
  assert any('Section A' in t for t in titles)
