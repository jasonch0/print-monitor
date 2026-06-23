const BUILDINGS: Record<string, string> = {
  oneill: "oneill",
  digitalstudio: "oneill",
  bapst: "bapst",
  erc: "erc",
  lawlib: "lawlib",
  mcelroy: "mcelroy",
  swl: "swl",
  tml: "tml",
};

export function locationOf(printerName: string): string {
  for (const prefix in BUILDINGS) {
    if (printerName.startsWith(prefix)) return BUILDINGS[prefix];
  }
  return "other";
}
