"""Fetch printer status pages and turn them into validated `PrinterData`."""

from datetime import datetime, timezone

import requests
import urllib3
from parsel import Selector

from printmonitor.schema import PrinterData, Supply, Tray

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def text(sel, css):
    value = sel.css(css).get()
    return value.strip() if value else None


def scrape_printer(url):
    resp = requests.get(url, verify=False, timeout=10)
    resp.raise_for_status()
    sel = Selector(text=resp.text)

    printer_name = text(sel, "#HomeDeviceIp::text")
    machine_status = text(sel, "#MachineStatus::text")

    supplies = []
    i = 0
    while True:
        name = text(sel, f"#SupplyName{i}::text")
        if name is None:
            break
        supplies.append(Supply(name=name, level=text(sel, f"#SupplyPLR{i}::text")))
        i += 1

    trays = []
    n = 1
    while True:
        name = text(sel, f"#TrayBinName_{n}::text")
        if name is None:
            break
        trays.append(Tray(name=name, status=text(sel, f"#TrayBinStatus_{n}::text")))
        n += 1

    return PrinterData(
        printer_name=printer_name,
        machine_status=machine_status,
        supplies=supplies,
        trays=trays,
        last_updated=datetime.now(timezone.utc),
    )


def scrape_all(urls):
    results = []
    for url in urls:
        try:
            results.append(scrape_printer(url))
        except Exception as exc:
            print(f"[scrape] skipping {url}: {exc}")
    return results
