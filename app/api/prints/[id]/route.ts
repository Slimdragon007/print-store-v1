import { NextResponse } from "next/server";
import { findPrint } from "@/lib/prints";
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const p = findPrint(params.id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: p.id,
    title: p.title,
    imageUrl: `/api/images/${encodeURIComponent(p.r2Key)}`,
    variants: p.variants.map(v => ({ id: v.id, label: v.label, priceCents: v.priceCents }))
  });
}