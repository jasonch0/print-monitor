"""Export the data contract as JSON Schema for frontend type generation."""

import json

from pydantic import TypeAdapter

from printmonitor.config import BACKEND_DIR
from printmonitor.schema import PrinterData

SCHEMA_FILE = BACKEND_DIR / "schema" / "printer.schema.json"


def main():
    schema = TypeAdapter(list[PrinterData]).json_schema()
    SCHEMA_FILE.parent.mkdir(parents=True, exist_ok=True)
    SCHEMA_FILE.write_text(json.dumps(schema, indent=2))
    print(f"wrote {SCHEMA_FILE}")


if __name__ == "__main__":
    main()
