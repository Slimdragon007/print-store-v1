'use client';
import { useEffect, useState } from "react";
import Header from "@/components/site/Header";
import Button from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

type Variant = { id: string; label: string; priceCents: number };
type Item = { id: string; title: string; imageUrl: string; variants: Variant[] };

export default function PrintsPage(){
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/prints").then(r => r.json()).then(d => setItems(d.items || []));
  }, []);

  async function buy(printId: string, variantId: string) {
    setBusy(`${printId}:${variantId}`);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        printId, variantId, quantity: 1,
        success_url: `${window.location.origin}/prints?success=1`,
        cancel_url: `${window.location.origin}/prints?canceled=1`
      })
    });
    const data = await res.json();
    setBusy(null);
    if (data.url) window.location.href = data.url;
    else alert(data.error || "Checkout failed");
  }

  const shown = items.filter(p => {
    if (!q.trim()) return true;
    const s = (p.title + " " + p.id).toLowerCase();
    return s.includes(q.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header/>
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-6 md:grid-cols-[1fr,320px]">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Fine Art Prints</h1>
            <p className="text-neutral-600 mt-3 max-w-prose">
              Museum-grade photo prints made to order. Choose a size, check out securely via Stripe.
            </p>
          </div>
          <div className="flex items-end">
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Search by title…"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {shown.length === 0 ? (
          <p className="text-neutral-500">No prints match your search.</p>
        ) : (
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(p => (
              <Card key={p.id}>
                <div className="aspect-[4/3] overflow-hidden rounded-t-lg bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt={p.title} className="h-full w-full object-cover" />
                </div>
                <CardBody>
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <div className="mt-3 grid gap-2">
                    {p.variants.map(v => (
                      <Button
                        key={v.id}
                        onClick={() => buy(p.id, v.id)}
                        disabled={busy===`${p.id}:${v.id}`}
                      >
                        {busy===`${p.id}:${v.id}` ? "Processing…" : `Buy ${v.label} — $${(v.priceCents/100).toFixed(2)}`}
                      </Button>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-16 border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 h-16 text-sm text-neutral-500 flex items-center">
          © {new Date().getFullYear()} MH Photography. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
