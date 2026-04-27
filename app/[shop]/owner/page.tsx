'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import type { Flag } from '@/lib/supabase'
import Link from 'next/link'

export default function OwnerPage() {
  const { itemIds, loading: shopLoading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (shopLoading) return
    loadFlags()
    const channel = supabase
      .channel('flags-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flags' }, () => loadFlags())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopLoading, itemIds.length])

  async function loadFlags() {
    if (itemIds.length === 0) { setFlags([]); setLoading(false); return }
    const { data } = await supabase
      .from('flags')
      .select('*, item:items(*, category:categories(*))')
      .in('item_id', itemIds)
      .in('status', ['pending', 'ordered'])
      .order('flagged_at', { ascending: false })
    if (data) setFlags(data as Flag[])
    setLoading(false)
  }

  async function updateStatus(flagId: string, status: 'ordered' | 'received') {
    await supabase.from('flags').update({ status }).eq('id', flagId)
    if (status === 'received') setFlags(prev => prev.filter(f => f.id !== flagId))
    else setFlags(prev => prev.map(f => f.id === flagId ? { ...f, status } : f))
  }

  async function markAllOrdered() {
    const pendingIds = flags.filter(f => f.status === 'pending').map(f => f.id)
    if (!pendingIds.length) return
    await supabase.from('flags').update({ status: 'ordered' }).in('id', pendingIds)
    setFlags(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'ordered' } : f))
  }

  if (notFound || shopLoading || loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{notFound ? 'Shop not found.' : 'a moment...'}</p>
    </main>
  )

  const pending = flags.filter(f => f.status === 'pending')
  const ordered = flags.filter(f => f.status === 'ordered')

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>
      <div className="sticky top-0 backdrop-blur border-b px-4 py-4 z-10" style={{ background: 'rgba(245,239,224,0.96)', borderColor: 'var(--cream-dark)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)' }}>Owner Dashboard</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Reorder Board</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/${slug}/analytics`} className="text-xs px-3 py-1.5 uppercase tracking-widest" style={{ border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }}>Analytics</Link>
            <Link href={`/${slug}`} className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>← Home</Link>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {flags.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4 text-lg" style={{ border: '1px solid var(--wine)', color: 'var(--wine)', borderRadius: '50%' }}>✓</div>
            <p className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--text)' }}>All stocked up.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Staff will flag items when things run low.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="font-serif" style={{ fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--wine)' }}>Needs Reorder · {pending.length}</p>
                  <button onClick={markAllOrdered} className="text-xs underline" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Mark all ordered</button>
                </div>
                <div className="space-y-2">{pending.map(flag => <FlagCard key={flag.id} flag={flag} onOrdered={() => updateStatus(flag.id, 'ordered')} onReceived={() => updateStatus(flag.id, 'received')} />)}</div>
              </div>
            )}
            {ordered.length > 0 && (
              <div>
                <p className="font-serif mb-3 px-1" style={{ fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#7A5A30' }}>Ordered · Awaiting Delivery · {ordered.length}</p>
                <div className="space-y-2">{ordered.map(flag => <FlagCard key={flag.id} flag={flag} onOrdered={() => updateStatus(flag.id, 'ordered')} onReceived={() => updateStatus(flag.id, 'received')} />)}</div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function FlagCard({ flag, onOrdered, onReceived }: { flag: Flag; onOrdered: () => void; onReceived: () => void }) {
  const item = flag.item as any
  const isOrdered = flag.status === 'ordered'
  return (
    <div style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', opacity: isOrdered ? 0.78 : 1, border: '1px solid var(--cream-dark)', borderLeft: `3px solid ${isOrdered ? 'var(--gold)' : 'var(--wine)'}` }}>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>{item?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{item?.category?.name} · {flag.flagged_by} · {getTimeAgo(flag.flagged_at)}</p>
            {flag.note && <p className="text-sm mt-1.5 italic px-2.5 py-1.5" style={{ background: 'var(--cream)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)' }}>&quot;{flag.note}&quot;</p>}
          </div>
          <span className="text-xs px-2.5 py-1 flex-shrink-0 uppercase tracking-widest" style={isOrdered ? { background: 'rgba(196,168,130,0.15)', color: '#7A5A30', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.2em' } : { background: 'rgba(107,39,55,0.08)', color: 'var(--wine)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.2em' }}>
            {isOrdered ? 'Ordered' : 'Low'}
          </span>
        </div>
        <div className="flex gap-2 mt-3">
          {!isOrdered && <button onClick={onOrdered} className="flex-1 py-2.5 text-xs uppercase tracking-widest" style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>Mark Ordered</button>}
          <button onClick={onReceived} className={`py-2.5 text-xs uppercase tracking-widest ${isOrdered ? 'flex-1' : 'px-4'}`} style={{ border: '1px solid rgba(0,0,0,0.1)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
            {isOrdered ? 'Mark Received ✓' : 'Received'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
