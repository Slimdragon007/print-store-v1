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
    
    // Better notification than alert
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-bottom z-50';
    toast.textContent = 'Added to cart!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold">Print Store</h1>
            <Link 
              href="/cart" 
              className="relative inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span className="ml-2 bg-white text-black text-xs font-bold px-2 py-1 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Fine Art Photography Prints
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Museum-quality prints delivered worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(p => (
            <div 
              key={p.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="aspect-w-16 aspect-h-12 bg-gray-200">
                <img 
                  src={p.imageUrl} 
                  alt={p.title} 
                  className="w-full h-64 object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{p.title}</h3>
                <div className="space-y-2">
                  {p.variants.map(v => (
                    <div key={v.id} className="flex gap-2">
                      <button 
                        onClick={() => addToCart(p, v)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-900 rounded-md hover:bg-gray-200 transition-colors font-medium"
                      >
                        Add to Cart - ${(v.priceCents/100).toFixed(2)}
                      </button>
                      <button 
                        onClick={() => buyNow(p.id, v.id)} 
                        disabled={busy===`${p.id}:${v.id}`}
                        className={`px-3 py-2 text-sm rounded-md font-medium transition-all ${
                          busy===`${p.id}:${v.id}`
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-800'
                        }`}
                      >
                        {busy===`${p.id}:${v.id}` ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing
                          </span>
                        ) : "Buy Now"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t mt-24">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Print Store. All rights reserved. Payments powered by Stripe.
          </p>
        </div>
      </footer>
    </main>
  );
}