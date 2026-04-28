'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

type OrderItem = { name: string; note: string | null; flaggedBy: string }
type Order = {
  id: string
  supplier_name: string
  items: OrderItem[]
  created_at: string
  confirmed_at: string | null
  delivery_note: string | null
  estimated_delivery: string | null
  shop: { name: string }
}

export default function ConfirmPage() {
  const { token } = useParams<{ token: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [note, setNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    loadOrder()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function loadOrder() {
    const { data } = await supabase
      .from('orders')
      .select('*, shop:shops(name)')
      .eq('confirmation_token', token)
      .single()
    if (!data) { setNotFound(true); setLoading(false); return }
    setOrder(data as Order)
    setLoading(false)
  }

  async function confirm() {
    if (!order) return
    setConfirming(true)
    await supabase.from('orders').update({
      confirmed_at: new Date().toISOString(),
      estimated_delivery: deliveryDate || null,
      delivery_note: note.trim() || null,
    }).eq('id', order.id)
    setDone(true)
    setConfirming(false)
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F4' }}>
      <p style={{ fontFamily: 'Georgia, serif', color: '#9A8878', fontStyle: 'italic' }}>a moment…</p>
    </main>
  )

  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#FAF8F4' }}>
      <div className="text-center">
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: 300, color: '#3B2A1A' }}>Order not found.</p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#9A8878', marginTop: '0.5rem' }}>This link may be invalid or expired.</p>
      </div>
    </main>
  )

  if (!order) return null

  const alreadyConfirmed = !!order.confirmed_at
  const shopName = (order.shop as unknown as { name: string })?.name || 'the restaurant'

  if (done || alreadyConfirmed) return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#FAF8F4' }}>
      <div className="text-center" style={{ maxWidth: '400px' }}>
        <div style={{ width: '52px', height: '52px', border: '1px solid rgba(107,39,55,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.1rem', color: '#6B2737' }}>✓</div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', fontWeight: 300, color: '#3B2A1A' }}>Order confirmed.</p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#9A8878', marginTop: '0.5rem' }}>
          {shopName} has been notified.
          {(done ? deliveryDate : order.estimated_delivery) && (
            <> Delivery expected {done ? deliveryDate : order.estimated_delivery}.</>
          )}
        </p>
        <div style={{ marginTop: '2rem', padding: '1rem 1.25rem', background: 'white', border: '1px solid #EAE0CE', borderRadius: '4px', textAlign: 'left' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>Items ordered</p>
          {order.items.map((item, i) => (
            <p key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#3B2A1A', padding: '0.35rem 0', borderTop: i > 0 ? '1px solid #EAE0CE' : undefined }}>
              {item.name}{item.note ? <span style={{ color: '#9A8878' }}> — {item.note}</span> : null}
            </p>
          ))}
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen px-5 py-12" style={{ background: '#FAF8F4' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.62rem', letterSpacing: '0.35em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.5rem' }}>
          corner · order request
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontWeight: 300, color: '#3B2A1A', lineHeight: 1.2, marginBottom: '0.4rem' }}>
          {shopName}
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#9A8878', marginBottom: '2rem' }}>
          Hi {order.supplier_name} — {shopName} needs to reorder the following:
        </p>

        <div style={{ background: 'white', border: '1px solid #EAE0CE', borderRadius: '4px', overflow: 'hidden', marginBottom: '2rem' }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ padding: '0.875rem 1.1rem', borderTop: i > 0 ? '1px solid #EAE0CE' : undefined, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: '#3B2A1A', fontWeight: 500 }}>{item.name}</p>
                {item.note && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: '#9A8878', marginTop: '2px' }}>{item.note}</p>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A8878', display: 'block', marginBottom: '0.4rem' }}>
            Estimated delivery date <span style={{ opacity: 0.6 }}>(optional)</span>
          </label>
          <input
            type="date"
            value={deliveryDate}
            onChange={e => setDeliveryDate(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#3B2A1A', background: 'white', border: '1px solid #EAE0CE', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A8878', display: 'block', marginBottom: '0.4rem' }}>
            Note for {shopName} <span style={{ opacity: 0.6 }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. substituting brand, partial fulfillment, delivery window…"
            style={{ width: '100%', padding: '0.75rem 1rem', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#3B2A1A', background: 'white', border: '1px solid #EAE0CE', borderRadius: '4px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={confirm}
          disabled={confirming}
          style={{ width: '100%', padding: '1rem', background: '#6B2737', color: '#FAF8F4', fontFamily: 'DM Sans, sans-serif', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', borderRadius: '4px', border: 'none', cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? 0.6 : 1 }}>
          {confirming ? 'Confirming…' : 'Confirm this order →'}
        </button>

        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.68rem', color: '#C4A882', textAlign: 'center', marginTop: '1.5rem' }}>
          Sent via Corner · back-of-house intelligence
        </p>
      </div>
    </main>
  )
}
