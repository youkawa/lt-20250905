import io
import json
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def make_notebook():
    nb = {
        "cells": [
            {"cell_type": "markdown", "source": "# Title"},
            {
                "cell_type": "code",
                "execution_count": 1,
                "source": "print('hi')",
                "outputs": [
                    {
                        "output_type": "stream",
                        "name": "stdout",
                        "text": "hi\n",
                    }
                ],
            },
        ],
        "metadata": {},
        "nbformat": 4,
        "nbformat_minor": 2,
    }
    return json.dumps(nb).encode("utf-8")


def test_parse():
    content = make_notebook()
    files = {"file": ("sample.ipynb", io.BytesIO(content), "application/json")}
    res = client.post("/parse", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "sample.ipynb"
    assert len(data["cells"]) == 2
    assert data["cells"][0]["cell_type"] == "markdown"
    assert data["cells"][1]["cell_type"] == "code"
    # stream output mapped to nbformat-like
    assert data["cells"][1]["outputs"][0]["output_type"] in ("stream", "display_data")
