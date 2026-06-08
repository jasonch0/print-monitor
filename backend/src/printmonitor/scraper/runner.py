"""Continuous scrape loop: read URLs, scrape, write data.json, repeat."""

import time

from printmonitor import store
from printmonitor.config import SCRAPE_INTERVAL, URLS_FILE
from printmonitor.scraper.scrape import scrape_all


def load_urls():
    urls = []
    for line in URLS_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            urls.append(line)
    return urls


def run():
    while True:
        printers = scrape_all(load_urls())
        store.write(printers)
        print(f"[runner] wrote {len(printers)} printers")
        time.sleep(SCRAPE_INTERVAL)


if __name__ == "__main__":
    run()
