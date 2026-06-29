import { SortingFn } from "@tanstack/react-table";
import { PrinterData } from "@/lib/types";

export const RED = "text-red-700";
export const ORANGE = "text-orange-500";

export const VISIBLE_TRAYS = ["Tray 2", "Tray 3"];

export function secondsAgo(isoString: string): number {
  return Math.round((Date.now() - new Date(isoString).getTime()) / 1000);
}

export function isLowSupply(level: string | null | undefined): boolean {
  if (!level) return false;
  const n = parseInt(level.replace(/[^\d]/g, ""), 10);
  return !Number.isNaN(n) && n <= 20;
}

export function statusColor(status: string | null | undefined): string {
  if (!status) return "";
  return /jam|mismatch|empty|issue|low/.test(status.toLowerCase()) ? RED : "";
}

export function statusIsProblem(p: PrinterData): boolean {
  return statusColor(p.machine_status) !== "";
}

export function tonerIsProblem(p: PrinterData): boolean {
  return p.supplies?.some((s) => s.is_toner && isLowSupply(s.level)) ?? false;
}

export function suppliesIsProblem(p: PrinterData): boolean {
  return p.supplies?.some((s) => !s.is_toner && isLowSupply(s.level)) ?? false;
}

export function traysIsProblem(p: PrinterData): boolean {
  return (
    p.trays?.some((t) => VISIBLE_TRAYS.includes(t.name) && t.status !== "OK") ??
    false
  );
}

export function bySeverity(
  isProblem: (p: PrinterData) => boolean,
): SortingFn<PrinterData> {
  return (rowA, rowB) => {
    const a = isProblem(rowA.original) ? 0 : 1;
    const b = isProblem(rowB.original) ? 0 : 1;
    if (a !== b) return a - b;
    return rowA.original.printer_name.localeCompare(rowB.original.printer_name);
  };
}

export const byFreshest: SortingFn<PrinterData> = (rowA, rowB) =>
  new Date(rowB.original.last_updated).getTime() -
  new Date(rowA.original.last_updated).getTime();
