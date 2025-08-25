'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      // Optionally fetch order details from your API
      fetch(`/api/orders?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          setOrderDetails(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  return (
    <main style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginTop: '48px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</h1>
        <h1>Order Successful!</h1>
        <p style={{ marginTop: '16px', color: '#666' }}>
          Thank you for your purchase! We've sent a confirmation email with your order details.
        </p>
        
        {orderDetails && (
          <div style={{ 
            marginTop: '32px', 
            padding: '24px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '8px',
            textAlign: 'left' 
          }}>
            <h3>Order Details</h3>
            <p>Order ID: {orderDetails.id}</p>
            <p>Total: ${(orderDetails.amount / 100).toFixed(2)}</p>
            <p>Status: {orderDetails.status}</p>
          </div>
        )}

        <div style={{ marginTop: '32px' }}>
          <Link href="/" style={{ 
            padding: '12px 24px', 
            backgroundColor: '#000', 
            color: '#fff', 
            textDecoration: 'none',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}