'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Flag } from '@/lib/supabase'
import Link from 'next/link'

export default function HistoryPage() {
  const [flags, setFlags] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('flags')
        .select('*, item:items(*, category:categories(*))')
        .eq('status', 'received')
        .order('flagged_at', { ascending: false })
        .limit(50)

      if (data) setFlags(data as Flag[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <p style={{ color: 'var(--muted)' }}>Loading history...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-10" style={{ background: 'var(--cream)' }}>
      <div className="sticky top-0 backdrop-blur border-b px-4 py-4 flex items-center justify-between z-10"
        style={{ background: 'rgba(247,241,232,0.95)', borderColor: 'var(--cream-dark)' }}>
        <h1 className="font-display italic text-xl font-bold" style={{ color: 'var(--text)' }}>Order History</h1>
        <Link href="/owner" className="text-sm" style={{ color: 'var(--muted)' }}>← Dashboard</Link>
      </div>

      <div className="px-4 pt-4 space-y-2">
        {flags.length === 0 && (
          <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
            No completed orders yet.
          </div>
        )}
        {flags.map(flag => {
          const item = flag.item as any
          return (
            <div key={flag.id} className="bg-white rounded-xl px-4 py-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-stone-700">{item?.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {item?.category?.name} · flagged by {flag.flagged_by}
                  </p>
                </div>
                <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                  RECEIVED
                </span>
              </div>
              {flag.note && (
                <p className="text-sm text-stone-400 mt-1 italic">&quot;{flag.note}&quot;</p>
              )}
              <p className="text-xs text-stone-300 mt-2">
                {new Date(flag.flagged_at).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}
              </p>
            </div>
          )
        })}
      </div>
    </main>
  )
}
