import fs from "node:fs";
import path from "node:path";
export type PrintVariant = { id: string; label: string; stripePriceId: string; priceCents: number };
export type PrintItem = { id: string; title: string; r2Key: string; variants: PrintVariant[] };
let _cache: PrintItem[] | null = null;
export function loadCatalog(): PrintItem[] {
  if (_cache) return _cache;
  const file = path.join(process.cwd(), "data", "prints.json");
  const raw = fs.readFileSync(file, "utf8");
  const json = JSON.parse(raw);
  _cache = json as PrintItem[];
  return _cache;
}
export function findPrint(id: string) { return loadCatalog().find(p => p.id === id); }
export function findVariant(p: PrintItem, variantId: string) { return p.variants.find(v => v.id === variantId); }