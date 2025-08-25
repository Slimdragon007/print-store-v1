import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/prints";
export async function GET() {
  const items = loadCatalog().map(p => ({
    id: p.id,
    title: p.title,
    imageUrl: `/api/images/${encodeURIComponent(p.r2Key)}`,
    variants: p.variants.map(v => ({ id: v.id, label: v.label, priceCents: v.priceCents }))
  }));
  return NextResponse.json({ items });
}