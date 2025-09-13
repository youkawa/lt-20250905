from __future__ import annotations
from typing import List, Dict, Any
import json
import base64
import uuid
import nbformat
from nbformat import NotebookNode
from ..schemas import ParsedCell, NBOutput


SUPPORTED_MIMES = {
    "text/plain",
    "image/png",
    "image/svg+xml",
    "application/vnd.plotly.v1+json",
}


def _to_nb_outputs(cell: NotebookNode) -> List[NBOutput]:
    outs: List[NBOutput] = []
    for out in cell.get("outputs", []) or []:
        output_type = out.get("output_type") or "stream"
        if output_type == "stream":
            text = out.get("text")
            if text:
                outs.append(NBOutput(output_type="stream", text=text))
            continue
        data = out.get("data") or {}
        if isinstance(data, dict):
            payload: Dict[str, Any] = {}
            for mime, value in data.items():
                if mime not in SUPPORTED_MIMES:
                    continue
                if mime == "image/png" and isinstance(value, (bytes, bytearray)):
                    b64 = base64.b64encode(value).decode("ascii")
                    payload[mime] = b64
                else:
                    payload[mime] = value
            if payload:
                outs.append(NBOutput(output_type=output_type, data=payload))
        else:
            text = out.get("text")
            if text:
                outs.append(NBOutput(output_type="stream", text=text))
    return outs


def parse_ipynb_bytes(content: bytes, notebook_name: str) -> List[ParsedCell]:
    # nbformatの厳密なバリデーションに失敗する素朴なノートブック（テスト生成など）にも対応するため、
    # 失敗時は素直なJSONパースにフォールバックする。
    try:
        nb = nbformat.reads(content.decode("utf-8"), as_version=4)
    except Exception:
        data = json.loads(content.decode("utf-8"))
        class _NB:  # 最低限の属性だけを持つ擬似オブジェクト
            def __init__(self, d: dict):
                self.cells = d.get("cells", [])
        nb = _NB(data)
    cells: List[ParsedCell] = []
    for idx, cell in enumerate(nb.cells):
        # nbformat.NotebookNode / dict の両対応
        cell_type = getattr(cell, "cell_type", None) if not isinstance(cell, dict) else cell.get("cell_type")
        if cell_type not in ("markdown", "code"):
            continue
        source = (cell.get("source", "") if isinstance(cell, dict) else getattr(cell, "source", ""))
        outputs = _to_nb_outputs(cell) if cell_type == "code" else []
        origin = {"notebookName": notebook_name, "cellIndex": idx}
        cells.append(
            ParsedCell(id=uuid.uuid4().hex, index=idx, cell_type=cell_type, source=source, outputs=outputs, origin=origin)
        )
    return cells
