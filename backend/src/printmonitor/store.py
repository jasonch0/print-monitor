"""Atomic read/write of the latest crawl to data.json."""

import os

from pydantic import TypeAdapter

from printmonitor.config import DATA_DIR, DATA_FILE
from printmonitor.schema import PrinterData

_adapter = TypeAdapter(list[PrinterData])

def write(printers):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = DATA_FILE.with_name(DATA_FILE.name + ".tmp")
    tmp.write_bytes(_adapter.dump_json(printers, indent=2))
    os.replace(tmp, DATA_FILE)


def read():
    if not DATA_FILE.exists():
        return []
    return _adapter.validate_json(DATA_FILE.read_bytes())
