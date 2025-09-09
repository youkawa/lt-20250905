from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_export_plotly_failure(monkeypatch):
    # Force plotly image export to fail
    import app.services.exporter as exporter_mod

    def boom(*args, **kwargs):
        raise RuntimeError("kaleido failed")

    monkeypatch.setattr(exporter_mod.pio, "to_image", boom)

    payload = {
        "title": "Plotly Report",
        "content": [
            {
                "type": "notebook_code",
                "source": "fig",
                "outputs": [
                    {
                        "output_type": "display_data",
                        "data": {"application/vnd.plotly.v1+json": {"data": [], "layout": {}}},
                    }
                ],
                "origin": {"notebookName": "p.ipynb", "cellIndex": 0},
            }
        ],
    }
    res = client.post("/export", json=payload)
    assert res.status_code == 200
    job = res.json()
    assert job["status"] == "failed"
    assert "kaleido failed" in (job.get("error") or "")
