"use client";

import { Fragment, useEffect, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingFn,
  SortingState,
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

function statusIsProblem(p: PrinterData): boolean {
  return statusColor(p.machine_status) !== "";
}

function suppliesIsProblem(p: PrinterData): boolean {
  return p.supplies?.some((s) => isLowSupply(s.level)) ?? false;
}

function traysIsProblem(p: PrinterData): boolean {
  return (
    p.trays?.some((t) => VISIBLE_TRAYS.includes(t.name) && t.status !== "OK") ??
    false
  );
}

function bySeverity(isProblem: (p: PrinterData) => boolean): SortingFn<PrinterData> {
  return (rowA, rowB) => {
    const a = isProblem(rowA.original) ? 0 : 1;
    const b = isProblem(rowB.original) ? 0 : 1;
    if (a !== b) return a - b;
    return rowA.original.printer_name.localeCompare(rowB.original.printer_name);
  };
}

const byFreshest: SortingFn<PrinterData> = (rowA, rowB) =>
  new Date(rowB.original.last_updated).getTime() -
  new Date(rowA.original.last_updated).getTime();

const columns = [
  columnHelper.accessor("printer_name", { header: "Printer" }),
  columnHelper.accessor("machine_status", {
    header: "Status",
    sortingFn: bySeverity(statusIsProblem),
    cell: (info) => (
      <span className={statusColor(info.getValue())}>{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("supplies", {
    header: "Supplies",
    sortingFn: bySeverity(suppliesIsProblem),
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
    sortingFn: bySeverity(traysIsProblem),
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
    sortingFn: byFreshest,
    cell: (info) => `${secondsAgo(info.getValue())}s ago`,
  }),
];

export default function Table() {
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

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
    state: { sorting },
    onSortingChange: setSorting,
    sortDescFirst: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
                onClick={header.column.getToggleSortingHandler()}
                className={`whitespace-nowrap border border-gray-200 px-4 py-2 font-medium text-black ${
                  header.column.getCanSort()
                    ? "cursor-pointer select-none hover:bg-white"
                    : ""
                }`}
              >
                <span className="flex w-full items-center justify-between gap-1">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getCanSort() &&
                    ({
                      asc: <span>▲</span>,
                      desc: <span>▼</span>,
                    }[header.column.getIsSorted() as string] ?? (
                      <span className="text-black">↕</span>
                    ))}
                </span>
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
