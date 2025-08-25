'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type CartItem = {
  printId: string;
  variantId: string;
  title: string;
  variant: string;
  price: number;
  stripePriceId: string;
  quantity: number;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const updateQuantity = (index: number, quantity: number) => {
    const newCart = [...cart];
    if (quantity <= 0) {
      newCart.splice(index, 1);
    } else {
      newCart[index].quantity = quantity;
    }
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const line_items = cart.map(item => ({
        price: item.stripePriceId,
        quantity: item.quantity
      }));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_items })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
        setLoading(false);
      }
    } catch (error) {
      alert('Checkout failed');
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main style={{ padding: '24px', textAlign: 'center' }}>
        <h1>Your Cart is Empty</h1>
        <p style={{ marginTop: '16px', color: '#666' }}>
          Add some beautiful prints to your cart!
        </p>
        <Link href="/" style={{ 
          marginTop: '24px',
          padding: '12px 24px', 
          backgroundColor: '#000', 
          color: '#fff', 
          textDecoration: 'none',
          borderRadius: '6px',
          display: 'inline-block'
        }}>
          Browse Prints
        </Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Shopping Cart</h1>
      
      <div style={{ marginTop: '24px' }}>
        {cart.map((item, index) => (
          <div key={index} style={{ 
            padding: '16px', 
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3>{item.title}</h3>
              <p style={{ color: '#666' }}>{item.variant}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div>
                <button onClick={() => updateQuantity(index, item.quantity - 1)}>-</button>
                <span style={{ margin: '0 12px' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(index, item.quantity + 1)}>+</button>
              </div>
              <div style={{ minWidth: '80px', textAlign: 'right' }}>
                ${((item.price * item.quantity) / 100).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '24px', 
        padding: '24px', 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2>Total</h2>
          <h2>${(getTotal() / 100).toFixed(2)}</h2>
        </div>
        <button 
          onClick={checkout}
          disabled={loading}
          style={{ 
            width: '100%',
            padding: '12px', 
            backgroundColor: loading ? '#ccc' : '#000', 
            color: '#fff', 
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Proceed to Checkout'}
        </button>
      </div>
    </main>
  );
}