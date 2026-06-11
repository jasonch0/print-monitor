"""FastAPI read API over the latest crawl in data.json."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from printmonitor import store
from printmonitor.schema import PrinterData

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/printer_data/", response_model=list[PrinterData])
def printer_data():
    return store.read()
