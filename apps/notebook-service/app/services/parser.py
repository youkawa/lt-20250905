from __future__ import annotations
from typing import List, Dict, Any
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
    nb = nbformat.reads(content.decode("utf-8"), as_version=4)
    cells: List[ParsedCell] = []
    for idx, cell in enumerate(nb.cells):
        if cell.cell_type not in ("markdown", "code"):
            continue
        source = cell.get("source", "")
        outputs = _to_nb_outputs(cell) if cell.cell_type == "code" else []
        origin = {"notebookName": notebook_name, "cellIndex": idx}
        cells.append(
            ParsedCell(id=uuid.uuid4().hex, index=idx, cell_type=cell.cell_type, source=source, outputs=outputs, origin=origin)
        )
    return cells
