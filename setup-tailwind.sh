#!/bin/bash
set -euo pipefail

# ─────────────────────────────
# 0) Safety check
# ─────────────────────────────
test -f package.json || { echo "❌ Run this from your project root (print-store-v1)"; exit 1; }
mkdir -p src/app src/components/ui src/components/site

# ─────────────────────────────
# 1) Tailwind + PostCSS (idempotent)
# ─────────────────────────────
npm i -D tailwindcss postcss autoprefixer tailwindcss-animate >/dev/null 2>&1 || true

cat > postcss.config.js <<'JS'
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
JS

cat > tailwind.config.ts <<'TS'
import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: { extend: {} },
  plugins: [require("tailwindcss-animate")]
};
export default config;
TS

# globals.css with Tailwind directives (only create if missing or empty)
if [ ! -s src/app/globals.css ] || ! grep -q "@tailwind base" src/app/globals.css 2>/dev/null; then
  cat > src/app/globals.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* base page chrome */
:root { color-scheme: light; }
html, body, #__next { height: 100%; }
body { background: #fafafa; }
CSS
fi

# Ensure root layout imports globals.css
LAYOUT="src/app/layout.tsx"
if [ -f "$LAYOUT" ]; then
  grep -q "import './globals.css'" "$LAYOUT" || sed -i '' "1i\\
import './globals.css';" "$LAYOUT" 2>/dev/null || \
  (printf "import './globals.css';\n" | cat - "$LAYOUT" > "$LAYOUT.tmp" && mv "$LAYOUT.tmp" "$LAYOUT")
else
  cat > "$LAYOUT" <<'TSX'
import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Print Store", description: "Fine art prints" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
TSX
fi

# ─────────────────────────────
# 2) Minimal UI components
# ─────────────────────────────
cat > src/components/site/Header.tsx <<'TSX'
'use client';
import Link from "next/link";
export default function Header(){
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">MH Photo</Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/prints" className="hover:opacity-70">Prints</Link>
        </nav>
      </div>
    </header>
  );
}
TSX

cat > src/components/ui/Button.tsx <<'TSX'
'use client';
import { ButtonHTMLAttributes } from "react";
export default function Button(props: ButtonHTMLAttributes<HTMLButtonElement>){
  const { className="", disabled, ...rest } = props;
  return (
    <button
      {...rest}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium " +
        "border-neutral-200 bg-black text-white hover:bg-neutral-800 " +
        "disabled:opacity-50 disabled:cursor-not-allowed transition " + className
      }
    />
  );
}
TSX

cat > src/components/ui/Card.tsx <<'TSX'
import { ReactNode } from "react";
export function Card({children}:{children:ReactNode}) {
  return <div className="border rounded-lg shadow-sm bg-white">{children}</div>;
}
export function CardBody({children}:{children:ReactNode}) {
  return <div className="p-4">{children}</div>;
}
TSX

# ─────────────────────────────
# 3) Custom /prints page (uses your existing APIs)
# ─────────────────────────────
mkdir -p src/app/prints
cat > src/app/prints/page.tsx <<'TSX'
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
TSX

# ─────────────────────────────
# 4) Quick sanity probes
# ─────────────────────────────
echo "---- Tailwind check (should find 3 directives) ----"
grep -n "@tailwind" src/app/globals.css || true

echo "✅ CSS + custom /prints wired. Visit http://localhost:3000/prints"