'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Flag } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export default function OwnerPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFlags()
    const channel = supabase
      .channel('flags-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flags' }, () => loadFlags())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadFlags() {
    const { data } = await supabase
      .from('flags')
      .select('*, item:items(*, category:categories(*))')
      .in('status', ['pending', 'ordered'])
      .order('flagged_at', { ascending: false })
    if (data) setFlags(data as Flag[])
    setLoading(false)
  }

  async function updateStatus(flagId: string, status: 'ordered' | 'received') {
    await supabase.from('flags').update({ status }).eq('id', flagId)
    if (status === 'received') {
      setFlags(prev => prev.filter(f => f.id !== flagId))
    } else {
      setFlags(prev => prev.map(f => f.id === flagId ? { ...f, status } : f))
    }
  }

  async function markAllOrdered() {
    const pendingIds = flags.filter(f => f.status === 'pending').map(f => f.id)
    if (!pendingIds.length) return
    await supabase.from('flags').update({ status: 'ordered' }).in('id', pendingIds)
    setFlags(prev => prev.map(f => f.status === 'pending' ? { ...f, status: 'ordered' } : f))
  }

  const pending = flags.filter(f => f.status === 'pending')
  const ordered = flags.filter(f => f.status === 'ordered')

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <p style={{ color: 'var(--muted)' }}>Loading...</p>
    </main>
  )

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="sticky top-0 backdrop-blur border-b px-4 py-4 z-10"
        style={{ background: 'rgba(247,241,232,0.95)', borderColor: 'var(--cream-dark)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/cellar-logo.svg" alt="The Cellar" width={36} height={19}
                style={{ filter: 'brightness(0)', opacity: 0.7 }} />
              <h1 className="font-display italic text-lg font-bold" style={{ color: 'var(--text)' }}>Owner Dashboard</h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>The Cellar · Reorder Board</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/analytics" className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: 'var(--cream-dark)', color: 'var(--text)' }}>
              Analytics
            </Link>
            <Link href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Home</Link>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {flags.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-xl"
              style={{ background: 'var(--wine)', color: 'var(--cream)' }}>✓</div>
            <p className="font-display italic text-xl font-bold" style={{ color: 'var(--text)' }}>All stocked up</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Staff will flag items when things run low.</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="font-label text-base tracking-widest" style={{ color: 'var(--wine)' }}>
                    Needs Reorder · {pending.length}
                  </p>
                  <button onClick={markAllOrdered} className="text-xs font-medium underline" style={{ color: 'var(--muted)' }}>
                    Mark all ordered
                  </button>
                </div>
                <div className="space-y-2">
                  {pending.map(flag => (
                    <FlagCard key={flag.id} flag={flag}
                      onOrdered={() => updateStatus(flag.id, 'ordered')}
                      onReceived={() => updateStatus(flag.id, 'received')} />
                  ))}
                </div>
              </div>
            )}

            {ordered.length > 0 && (
              <div>
                <p className="font-label text-base tracking-widest mb-3 px-1" style={{ color: 'var(--gold)' }}>
                  Ordered · Awaiting Delivery · {ordered.length}
                </p>
                <div className="space-y-2">
                  {ordered.map(flag => (
                    <FlagCard key={flag.id} flag={flag}
                      onOrdered={() => updateStatus(flag.id, 'ordered')}
                      onReceived={() => updateStatus(flag.id, 'received')} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function FlagCard({ flag, onOrdered, onReceived }: {
  flag: Flag; onOrdered: () => void; onReceived: () => void
}) {
  const item = flag.item as any
  const isOrdered = flag.status === 'ordered'

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--cream-dark)', opacity: isOrdered ? 0.75 : 1 }}>
      <div className="h-0.5 w-full" style={{ background: isOrdered ? 'var(--gold)' : 'var(--wine)' }} />
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold" style={{ color: 'var(--text)' }}>{item?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {item?.category?.name} · {flag.flagged_by} · {getTimeAgo(flag.flagged_at)}
            </p>
            {flag.note && (
              <p className="text-sm mt-1.5 italic rounded-xl px-2.5 py-1.5" style={{ background: 'var(--cream)', color: 'var(--muted)' }}>
                &quot;{flag.note}&quot;
              </p>
            )}
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0"
            style={isOrdered
              ? { background: '#FEF3C7', color: '#92400E' }
              : { background: '#FCE7EC', color: 'var(--wine)' }}>
            {isOrdered ? 'ORDERED' : 'LOW'}
          </span>
        </div>

        <div className="flex gap-2 mt-3">
          {!isOrdered && (
            <button onClick={onOrdered} className="font-label flex-1 py-2.5 rounded-xl text-base tracking-widest"
              style={{ background: 'var(--wine)', color: 'var(--cream)' }}>
              Mark Ordered
            </button>
          )}
          <button onClick={onReceived}
            className={`font-label py-2.5 rounded-xl text-base tracking-widest border-2 ${isOrdered ? 'flex-1' : 'px-4'}`}
            style={{ borderColor: 'rgba(0,0,0,0.12)', color: 'var(--muted)' }}>
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
