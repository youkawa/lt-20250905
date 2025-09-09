from __future__ import annotations

from typing import Any, List, Optional

from pydantic import BaseModel, Field
from typing import Literal


class ExportMetadata(BaseModel):
    projectId: Optional[str] = None
    reportId: Optional[str] = None
    author: Optional[str] = None
    dataSources: Optional[List[str]] = None


class ExportRequest(BaseModel):
    title: str = Field(..., description="Report title")
    content: List[Any] = Field(default_factory=list, description="ReportContentItem[]")
    metadata: Optional[ExportMetadata] = None
    templatePath: Optional[str] = Field(None, description="PPTX template path (optional)")
    format: Literal['pptx', 'pdf'] = Field('pptx', description="Output format")


class ExportJob(BaseModel):
    jobId: str
    status: str
    error: Optional[str] = None
    downloadUrl: Optional[str] = None
