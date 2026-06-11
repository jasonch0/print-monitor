"""Export the data contract as JSON Schema (to stdout) for frontend type generation."""

import json

from pydantic import TypeAdapter

from printmonitor.schema import PrinterData


def main():
    schema = TypeAdapter(list[PrinterData]).json_schema()
    print(json.dumps(schema, indent=2))


if __name__ == "__main__":
    main()
