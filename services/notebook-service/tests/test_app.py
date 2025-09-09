import pytest
import sys
import os
from fastapi.testclient import TestClient
import io

# ensure the service package root is on sys.path so `from app import app` works
ROOT = os.path.dirname(os.path.dirname(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from app import app

client = TestClient(app)

def test_health():
    r = client.get('/health')
    assert r.status_code == 200
    assert r.json() == {'status':'ok'}

def test_parse_notebook_ok():
    nb = {
        "cells": [
            {"cell_type": "markdown", "source": "# Title", "metadata": {}},
            {"cell_type": "code", "source": "print(1)", "metadata": {}}
        ],
        "metadata": {},
        "nbformat": 4,
        "nbformat_minor": 5
    }
    buf = io.BytesIO()
    import json
    buf.write(json.dumps(nb).encode('utf-8'))
    buf.seek(0)
    files = {'file': ('test.ipynb', buf, 'application/json')}
    r = client.post('/parse-notebook', files=files)
    assert r.status_code == 200
    data = r.json()
    assert 'cells' in data
    assert len(data['cells']) == 2

def test_parse_notebook_bad_ext():
    buf = io.BytesIO(b'{}')
    files = {'file': ('bad.txt', buf, 'text/plain')}
    r = client.post('/parse-notebook', files=files)
    assert r.status_code == 400

def test_generate_pptx_minimal():
    payload = {
        'id':'r1',
        'projectId':'p1',
        'metadata':{'title':'T'},
        'content': [
            {'id':'t1','type':'text_box','content':'Hello world'},
            {'id':'c1','type':'notebook_cell','sourceNotebook':{'name':'nb','cellIndex':0},'cellData':{'source':'print(1)'}}
        ]
    }
    r = client.post('/generate-pptx', json=payload)
    assert r.status_code == 200
    assert r.headers['content-type'].startswith('application/vnd.openxmlformats')
