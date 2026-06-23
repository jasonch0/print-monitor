import { Fragment } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { PrinterData } from "@/lib/types";
import {
  ORANGE,
  VISIBLE_TRAYS,
  byFreshest,
  bySeverity,
  isLowSupply,
  secondsAgo,
  statusColor,
  statusIsProblem,
  suppliesIsProblem,
  traysIsProblem,
} from "@/lib/severity";

const columnHelper = createColumnHelper<PrinterData>();

export const columns = [
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
