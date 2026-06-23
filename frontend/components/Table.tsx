"use client";

import { Fragment, useEffect, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PrinterData } from "@/lib/types";
import { fetchPrinterData } from "@/lib/api";

const POLL_INTERVAL_MS = 12_000;

function secondsAgo(isoString: string): number {
  return Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
}

const RED = "text-red-700";
const ORANGE = "text-orange-500";

function isLowSupply(level: string): boolean {
  const n = parseInt(level.replace(/[^\d]/g, ""), 10);
  return !Number.isNaN(n) && n <= 20;
}

function statusColor(status: string): string {
  const s = status.toLowerCase();
  return /jam|mismatch|empty|issue|low/.test(s) ? RED : "";
}

const columnHelper = createColumnHelper<PrinterData>();

const VISIBLE_TRAYS = ["Tray 2", "Tray 3"];

const columns = [
  columnHelper.accessor("printer_name", { header: "Printer" }),
  columnHelper.accessor("machine_status", {
    header: "Status",
    cell: (info) => (
      <span className={statusColor(info.getValue())}>{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("supplies", {
    header: "Supplies",
    cell: (info) =>
      info.getValue()?.map((s, i) => (
        <Fragment key={s.name}>
          {i > 0 && ", "}
          <span className={isLowSupply(s.level) ? ORANGE : ""}>
            {s.name.replace(" Cartridge", "")}: {s.level}
          </span>
        </Fragment>
      )),
  }),
  columnHelper.accessor("trays", {
    header: "Trays",
    cell: (info) =>
      info
        .getValue()
        ?.filter((t) => VISIBLE_TRAYS.includes(t.name))
        .map((t, i) => (
          <Fragment key={t.name}>
            {i > 0 && ", "}
            <span className={t.status !== "OK" ? ORANGE : ""}>
              {t.name}: {t.status}
            </span>
          </Fragment>
        )),
  }),
  columnHelper.accessor("last_updated", {
    header: "Last Updated",
    cell: (info) => `${secondsAgo(info.getValue())}s ago`,
  }),
];

export default function Table() {
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const table = useReactTable({
    data: printers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) {
    return <p className="text-red-600">Error: {error}</p>;
  }

  if (printers.length === 0) {
    return (
      <div className="flex items-center justify-center py-80">
        <div
          role="status"
          className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
        />
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-left text-sm text-gray-500">
      <thead className="bg-gray-50 text-sm uppercase text-black">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                className="whitespace-nowrap px-4 py-2 font-medium text-black"
              >
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="border-b border-gray-200 bg-white hover:bg-gray-100">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="border border-gray-200 px-4 py-2">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
