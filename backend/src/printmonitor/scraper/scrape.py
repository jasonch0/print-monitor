"""Fetch printer status pages and turn them into validated `PrinterData`."""

import ssl
from datetime import datetime, timezone

import requests
import urllib3
from parsel import Selector
from requests.adapters import HTTPAdapter
from urllib3.util.ssl_ import create_urllib3_context

from printmonitor.schema import PrinterData, Supply, Tray

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class LegacyTLSAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = create_urllib3_context()
        ctx.check_hostname = False # don't require cert's hostname to match the URL
        ctx.verify_mode = ssl.CERT_NONE  # don't require a trusted/valid cert at all
        ctx.set_ciphers("DEFAULT@SECLEVEL=0") # accept weak, old ciphers
        ctx.options |= getattr(ssl, "OP_LEGACY_SERVER_CONNECT", 0x4) # tolerate the old handshake style
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)


_session = requests.Session()
_session.mount("https://", LegacyTLSAdapter())


def text(sel, css):
    value = sel.css(css).get()
    return value.strip() if value else None


def scrape_printer(url):
    resp = _session.get(url, verify=False, timeout=10)
    resp.raise_for_status()
    sel = Selector(text=resp.text)

    printer_name = text(sel, "#HomeDeviceIp::text")
    if printer_name:
        printer_name = printer_name.removesuffix(".bc.edu")
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
