'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Period = '7d' | '30d' | 'all'

type ItemStat = {
  item_id: string
  item_name: string
  category_name: string
  flag_count: number
  last_flagged: string
  is_weekly: boolean
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [orderStats, setOrderStats] = useState<ItemStat[]>([])
  const [makeStats, setMakeStats] = useState<ItemStat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadStats() }, [period])

  async function loadStats() {
    setLoading(true)

    const since = period === 'all'
      ? null
      : new Date(Date.now() - (period === '7d' ? 7 : 30) * 86400000).toISOString()

    let flagQuery = supabase
      .from('flags')
      .select('item_id, flagged_at, item:items(name, is_weekly, category:categories(name))')
    if (since) flagQuery = flagQuery.gte('flagged_at', since)

    let taskQuery = supabase
      .from('tasks')
      .select('item_id, flagged_at, item:items(name, is_weekly, category:categories(name))')
    if (since) taskQuery = taskQuery.gte('flagged_at', since)

    const [{ data: flags }, { data: tasks }] = await Promise.all([flagQuery, taskQuery])

    setOrderStats(aggregate(flags || []))
    setMakeStats(aggregate(tasks || []))
    setLoading(false)
  }

  function aggregate(rows: any[]): ItemStat[] {
    const map: Record<string, ItemStat> = {}
    for (const row of rows) {
      const item = row.item
      if (!item) continue
      if (!map[row.item_id]) {
        map[row.item_id] = {
          item_id: row.item_id,
          item_name: item.name,
          category_name: item.category?.name || '—',
          flag_count: 0,
          last_flagged: row.flagged_at,
          is_weekly: item.is_weekly,
        }
      }
      map[row.item_id].flag_count++
      if (row.flagged_at > map[row.item_id].last_flagged) {
        map[row.item_id].last_flagged = row.flagged_at
      }
    }
    return Object.values(map).sort((a, b) => b.flag_count - a.flag_count)
  }

  const maxOrder = orderStats[0]?.flag_count || 1
  const maxMake = makeStats[0]?.flag_count || 1

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>
      <div className="sticky top-0 backdrop-blur border-b px-4 py-4 flex items-center justify-between z-10"
        style={{ background: 'rgba(247,241,232,0.95)', borderColor: 'var(--cream-dark)' }}>
        <h1 className="font-display italic text-xl font-bold" style={{ color: 'var(--text)' }}>Analytics</h1>
        <Link href="/owner" className="text-sm" style={{ color: 'var(--muted)' }}>← Owner</Link>
      </div>

      <div className="px-4 pt-6 space-y-8">
        {/* Period selector */}
        <div className="flex rounded-2xl overflow-hidden p-1 gap-1" style={{ background: 'var(--cream-dark)' }}>
          {(['7d', '30d', 'all'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="font-label flex-1 py-2 text-base tracking-widest rounded-xl transition-all"
            style={period === p
              ? { background: 'var(--wine)', color: 'var(--cream)' }
              : { color: 'var(--muted)' }}
            >
              {p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'All time'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-12" style={{ color: 'var(--muted)' }}>Loading...</p>
        ) : (
          <>
            {/* Reorder stats */}
            <section>
              <h2 className="font-label text-base tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
                Most Flagged for Reorder
              </h2>
              {orderStats.length === 0 ? (
                <p className="text-sm pl-2" style={{ color: 'var(--muted)' }}>No reorder flags in this period</p>
              ) : (
                <div className="space-y-2">
                  {orderStats.map((stat, i) => (
                    <StatRow key={stat.item_id} stat={stat} rank={i + 1} max={maxOrder} color="stone" />
                  ))}
                </div>
              )}
            </section>

            {/* Make stats */}
            <section>
              <h2 className="font-label text-base tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
                Most Flagged to Make
              </h2>
              {makeStats.length === 0 ? (
                <p className="text-sm pl-2" style={{ color: 'var(--muted)' }}>No make flags in this period</p>
              ) : (
                <div className="space-y-2">
                  {makeStats.map((stat, i) => (
                    <StatRow key={stat.item_id} stat={stat} rank={i + 1} max={maxMake} color="amber" />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

function StatRow({ stat, rank, max, color }: {
  stat: ItemStat
  rank: number
  max: number
  color: 'stone' | 'amber'
}) {
  const pct = Math.round((stat.flag_count / max) * 100)
  const barBg = color === 'stone' ? 'var(--wine)' : 'var(--gold)'

  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: 'white', border: '1px solid var(--cream-dark)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs w-4 text-right" style={{ color: 'var(--muted)' }}>{rank}</span>
          <div>
            <span className="font-medium" style={{ color: 'var(--text)' }}>{stat.item_name}</span>
            {stat.is_weekly && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(184,136,46,0.15)', color: 'var(--gold)' }}>weekly</span>
            )}
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{stat.category_name}</p>
          </div>
        </div>
        <span className="font-bold text-lg" style={{ color: 'var(--wine)' }}>{stat.flag_count}×</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barBg }}
        />
      </div>
    </div>
  )
}
