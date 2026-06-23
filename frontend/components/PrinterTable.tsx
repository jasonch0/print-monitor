import { flexRender, Table as TanstackTable } from "@tanstack/react-table";
import { PrinterData } from "@/lib/types";

export default function PrinterTable({
  table,
}: {
  table: TanstackTable<PrinterData>;
}) {
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
                    header.getContext(),
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
          <tr
            key={row.id}
            className="border-b border-gray-200 bg-white hover:bg-gray-100"
          >
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
