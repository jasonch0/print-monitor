"""Single source of truth for the print-monitor data contract."""

from datetime import datetime

from pydantic import BaseModel, Field


class Supply(BaseModel):
    name: str
    level: str | None = None
    is_toner: bool | None = None


class Tray(BaseModel):
    name: str
    status: str | None = None


class PrinterData(BaseModel):
    printer_name: str
    machine_status: str | None = None
    supplies: list[Supply] = Field(default_factory=list)
    trays: list[Tray] = Field(default_factory=list)
    last_updated: datetime
