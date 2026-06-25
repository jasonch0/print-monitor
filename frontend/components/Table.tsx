"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { PrinterData } from "@/lib/types";
import { fetchPrinterData } from "@/lib/api";
import { locationOf } from "@/lib/locations";
import { columns } from "./columns";
import PrinterTable from "./PrinterTable";

const POLL_INTERVAL_MS = 12_000;

export default function Table() {
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [location, setLocation] = useState("All");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchPrinterData();
        if (active) {
          setPrinters(data);
          setError(null);
        }
      } catch (err) {
        if (active) setError(String(err));
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const locationOptions = useMemo(() => {
    const seen = new Set(printers.map((p) => locationOf(p.printer_name)));
    return Array.from(seen).sort((a, b) =>
      a === "other" ? 1 : b === "other" ? -1 : a.localeCompare(b),
    );
  }, [printers]);

  const visiblePrinters = useMemo(
    () =>
      location === "All"
        ? printers
        : printers.filter((p) => locationOf(p.printer_name) === location),
    [printers, location],
  );

  const table = useReactTable({
    data: visiblePrinters,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    sortDescFirst: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const header = (
    <div className="mb-2 flex items-center justify-between px-4">
      <div>
        <h1 className="text-lg font-semibold">BC Print Monitor</h1>
        <p className="text-xs text-gray-500">rebuilt by Jason Cho '26, originally by Andrew R. Clark '24</p>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="location-filter" className="text-sm text-gray-700">
          Location:
        </label>
        <select
          id="location-filter"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded border border-gray-200 px-2 py-1 text-sm text-black"
        >
          <option value="All">All</option>
          {locationOptions.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const body = error ? (
    <p className="px-4 text-red-600">Error: {error}</p>
  ) : printers.length === 0 ? (
    <div className="flex items-center justify-center py-80">
      <div
        role="status"
        className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
      />
    </div>
  ) : (
    <PrinterTable table={table} />
  );

  return (
    <div>
      {header}
      {body}
    </div>
  );
}
