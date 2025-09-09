from __future__ import annotations
from typing import List, Literal, Optional, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    version: str


# nbformat 風の出力表現（最小）
class NBOutput(BaseModel):
    output_type: str
    text: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class ParsedCell(BaseModel):
    id: str
    index: int
    cell_type: Literal["markdown", "code"]
    source: str
    outputs: List[NBOutput] = Field(default_factory=list)
    origin: Dict[str, Any] = Field(default_factory=dict)


class ParseResponse(BaseModel):
    name: str
    cells: List[ParsedCell]
