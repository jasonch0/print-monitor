import { flexRender, Table as TanstackTable } from "@tanstack/react-table";
import { PrinterData } from "@/lib/types";

export default function PrinterCards({
  table,
}: {
  table: TanstackTable<PrinterData>;
}) {
  return (
    <div className="flex flex-col gap-3 px-4">
      {table.getRowModel().rows.map((row) => {
        const [title, ...rest] = row.getVisibleCells();
        return (
          <div
            key={row.id}
            className="rounded border border-gray-200 bg-white p-3 text-sm"
          >
            <div className="-mx-3 mb-2 border-b border-gray-200 px-3 pb-2 font-medium text-black">
              {flexRender(title.column.columnDef.cell, title.getContext())}
            </div>
            <dl className="flex flex-col gap-1">
              {rest.map((cell) => {
                const label = cell.column.columnDef.header;
                return (
                  <div key={cell.id} className="flex justify-between gap-3">
                    <dt className="shrink-0 text-gray-500">
                      {typeof label === "string" ? label : null}
                    </dt>
                    <dd className="text-right text-gray-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}
    </div>
  );
}
