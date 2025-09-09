# Notebook Processing Service

Minimal FastAPI service that provides endpoints used by the Notebook Report Weaver project:

- `GET /health` - health check
- `POST /parse-notebook` - accepts an `.ipynb` UploadFile and returns parsed cells as JSON
- `POST /generate-pptx` - accepts JSON report and returns a generated PPTX (simple stub implementation)

Run locally (recommended in a virtualenv):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8001
```

Endpoints:

- GET /health
- POST /parse-notebook (multipart form, field name: `file`)
- POST /generate-pptx (application/json)
