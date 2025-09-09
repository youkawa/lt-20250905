# lt-20250905

## Quick start (notebook-service)

Run the notebook processing service locally using Docker Compose:

```bash
docker compose up --build
```

Or run locally in a virtualenv:

```bash
cd services/notebook-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 127.0.0.1 --port 8001
```
