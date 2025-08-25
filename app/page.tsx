'use client';
import { useEffect, useState } from "react";
import Link from "next/link";

type Variant = { id: string; label: string; priceCents: number; stripePriceId?: string };
type Item = { id: string; title: string; imageUrl: string; variants: Variant[] };

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => { 
    fetch("/api/prints").then(r => r.json()).then(d => setItems(d.items || [])); 
    updateCartCount();
  }, []);

  function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
  }

  async function buyNow(printId: string, variantId: string) {
    setBusy(`${printId}:${variantId}`);
    const res = await fetch("/api/checkout", { 
      method: "POST", 
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ printId, variantId }) 
    });
    const data = await res.json(); 
    setBusy(null);
    if (data.url) window.location.href = data.url; 
    else alert(data.error || "Checkout failed");
  }

  function addToCart(print: Item, variant: Variant) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.findIndex((item: any) => 
      item.printId === print.id && item.variantId === variant.id
    );

    if (existing >= 0) {
      cart[existing].quantity += 1;
    } else {
      cart.push({
        printId: print.id,
        variantId: variant.id,
        title: print.title,
        variant: variant.label,
        price: variant.priceCents,
        stripePriceId: variant.stripePriceId || variant.id,
        quantity: 1
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert('Added to cart!');
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Print Store</h1>
        <Link href="/cart" style={{ 
          padding: '8px 16px', 
          backgroundColor: '#000', 
          color: '#fff', 
          textDecoration: 'none',
          borderRadius: 4,
          position: 'relative'
        }}>
          Cart {cartCount > 0 && `(${cartCount})`}
        </Link>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {items.map(p => (
          <div key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <img src={p.imageUrl} alt={p.title} style={{ width: '100%', borderRadius: 6 }} />
            <h3>{p.title}</h3>
            {p.variants.map(v => (
              <div key={v.id} style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => addToCart(p, v)}
                  style={{ flex: 1, padding: '8px 12px', cursor: 'pointer' }}
                >
                  Add to Cart - ${(v.priceCents/100).toFixed(2)}
                </button>
                <button 
                  onClick={() => buyNow(p.id, v.id)} 
                  disabled={busy===`${p.id}:${v.id}`}
                  style={{ padding: '8px 12px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: 4, cursor: busy===`${p.id}:${v.id}` ? 'not-allowed' : 'pointer' }}
                >
                  {busy===`${p.id}:${v.id}` ? "Processing…" : "Buy Now"}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}