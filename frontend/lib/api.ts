import { PrinterData } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchPrinterData(): Promise<PrinterData[]> {
  const res = await fetch(`${API_BASE}/printer_data/`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch printer data: ${res.status}`);
  }
  return res.json();
}
