'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Period = '7d' | '30d' | 'all'

interface FlagRow { item_id: string; flagged_by: string; flagged_at: string; status: string; item: { name: string; is_weekly: boolean; category: { name: string } | null } | null }
interface TaskRow { item_id: string; flagged_by: string; flagged_at: string; urgency: string; status: string; item: { name: string; category: { name: string } | null } | null }

export default function AnalyticsPage() {
  const { itemIds, loading: shopLoading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()
  const [period, setPeriod] = useState<Period>('30d')
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [pendingNow, setPendingNow] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!shopLoading) load(period)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopLoading, period, itemIds.length])

  async function load(p: Period) {
    if (itemIds.length === 0) { setFlags([]); setTasks([]); setPendingNow(0); setLoading(false); return }
    setLoading(true)
    const since = p === 'all' ? null : new Date(Date.now() - (p === '7d' ? 7 : 30) * 86400000).toISOString()

    let flagQ = supabase.from('flags').select('item_id, flagged_by, flagged_at, status, item:items(name, is_weekly, category:categories(name))').in('item_id', itemIds)
    let taskQ = supabase.from('tasks').select('item_id, flagged_by, flagged_at, urgency, status, item:items(name, category:categories(name))').in('item_id', itemIds)
    const pendingQ = supabase.from('flags').select('id', { count: 'exact', head: true }).in('item_id', itemIds).eq('status', 'pending')

    if (since) { flagQ = flagQ.gte('flagged_at', since); taskQ = taskQ.gte('flagged_at', since) }
    const [{ data: f }, { data: t }, { count }] = await Promise.all([flagQ, taskQ, pendingQ])
    setFlags((f || []) as unknown as FlagRow[])
    setTasks((t || []) as unknown as TaskRow[])
    setPendingNow(count || 0)
    setLoading(false)
  }

  const itemFlagCounts = useMemo(() => { const map: Record<string, { name: string; cat: string; count: number; isWeekly: boolean }> = {}; for (const f of flags) { if (!f.item) continue; if (!map[f.item_id]) map[f.item_id] = { name: f.item.name, cat: f.item.category?.name || '—', count: 0, isWeekly: f.item.is_weekly }; map[f.item_id].count++ }; return Object.values(map).sort((a, b) => b.count - a.count) }, [flags])
  const itemTaskCounts = useMemo(() => { const map: Record<string, { name: string; cat: string; count: number; urgentCount: number }> = {}; for (const t of tasks) { if (!t.item) continue; if (!map[t.item_id]) map[t.item_id] = { name: t.item.name, cat: t.item.category?.name || '—', count: 0, urgentCount: 0 }; map[t.item_id].count++; if (t.urgency === 'urgent') map[t.item_id].urgentCount++ }; return Object.values(map).sort((a, b) => b.count - a.count) }, [tasks])
  const catCounts = useMemo(() => { const map: Record<string, number> = {}; for (const f of flags) { const cat = f.item?.category?.name || 'Other'; map[cat] = (map[cat] || 0) + 1 }; return Object.entries(map).sort((a, b) => b[1] - a[1]) }, [flags])
  const staffCounts = useMemo(() => { const map: Record<string, number> = {}; for (const r of [...flags, ...tasks]) { if (!r.flagged_by) continue; map[r.flagged_by] = (map[r.flagged_by] || 0) + 1 }; return Object.entries(map).sort((a, b) => b[1] - a[1]) }, [flags, tasks])
  const dayCounts = useMemo(() => { const c = [0, 0, 0, 0, 0, 0, 0]; for (const f of flags) c[new Date(f.flagged_at).getDay()]++; return c }, [flags])

  const resolvedCount = flags.filter(f => f.status === 'received').length
  const resolutionRate = flags.length > 0 ? Math.round((resolvedCount / flags.length) * 100) : null
  const urgentCount = tasks.filter(t => t.urgency === 'urgent').length
  const topStaff = staffCounts[0]
  const peakDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayCounts.indexOf(Math.max(...dayCounts))]
  const maxFlag = itemFlagCounts[0]?.count || 1
  const maxTask = itemTaskCounts[0]?.count || 1
  const maxCat = catCounts[0]?.[1] || 1
  const maxDay = Math.max(...dayCounts) || 1
  const maxStaff = staffCounts[0]?.[1] || 1
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hasData = flags.length > 0 || tasks.length > 0

  if (notFound) return <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}><p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Shop not found.</p></main>

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>
      <div className="sticky top-0 backdrop-blur border-b px-4 py-4 flex items-center justify-between z-10" style={{ background: 'rgba(245,239,224,0.96)', borderColor: 'var(--cream-dark)' }}>
        <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)' }}>Analytics</h1>
        <Link href={`/${slug}/owner`} className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>← Owner</Link>
      </div>

      <div className="px-4 pt-5 space-y-7">
        <div className="flex gap-1.5 p-1" style={{ background: 'var(--cream-dark)', borderRadius: '4px' }}>
          {(['7d', '30d', 'all'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className="flex-1 py-2.5 text-xs uppercase transition-all"
              style={period === p ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' } : { color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }}>
              {p === '7d' ? '7 days' : p === '30d' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>

        {(shopLoading || loading) ? (
          <p className="text-center py-20 font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>a moment...</p>
        ) : !hasData ? (
          <div className="text-center py-24">
            <p className="font-serif" style={{ fontStyle: 'italic', color: 'var(--muted)', fontSize: '1.2rem' }}>No activity in this period yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <KpiCard label="Reorder flags" value={String(flags.length)} sub={`${pendingNow} pending now`} color="var(--wine)" />
              <KpiCard label="Kitchen tasks" value={String(tasks.length)} sub={urgentCount > 0 ? `${urgentCount} marked urgent` : 'none urgent'} color="var(--terra)" />
              <KpiCard label="Resolved" value={resolutionRate !== null ? `${resolutionRate}%` : '—'} sub="of flags received" color="#7A5A30" />
              <KpiCard label="Top contributor" value={topStaff ? topStaff[0] : '—'} sub={topStaff ? `${topStaff[1]} flags · ${peakDay} busiest` : 'no activity'} color="var(--muted)" />
            </div>

            {itemFlagCounts.length > 0 && <section><SectionLabel>Runs Low Most Often</SectionLabel><div className="space-y-1.5">{itemFlagCounts.slice(0, 8).map((item, i) => <BarRow key={item.name} rank={i + 1} name={item.name} sub={item.cat} count={item.count} max={maxFlag} barColor="var(--wine)" badge={item.isWeekly ? 'weekly' : undefined} />)}</div></section>}
            {itemTaskCounts.length > 0 && <section><SectionLabel>Made Most Often</SectionLabel><div className="space-y-1.5">{itemTaskCounts.slice(0, 8).map((item, i) => <BarRow key={item.name} rank={i + 1} name={item.name} sub={item.cat} count={item.count} max={maxTask} barColor="var(--terra)" badge={item.urgentCount > 0 ? `${item.urgentCount}× urgent` : undefined} badgeUrgent />)}</div></section>}

            {catCounts.length > 1 && <section><SectionLabel>By Category</SectionLabel><div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>{catCounts.map(([cat, count], i) => <div key={cat} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? '1px solid var(--cream-dark)' : undefined }}><span className="flex-1 text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>{cat}</span><div style={{ width: '72px', height: '3px', background: 'var(--cream-dark)', borderRadius: '2px' }}><div style={{ width: `${Math.round((count / maxCat) * 100)}%`, height: '100%', background: 'var(--gold)', borderRadius: '2px' }} /></div><span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', minWidth: '20px', textAlign: 'right' }}>{count}</span></div>)}</div></section>}

            {flags.length >= 3 && <section><SectionLabel>When Things Run Low</SectionLabel><div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.25rem 1rem 1rem' }}><div className="flex items-end justify-between gap-1">{DAYS.map((day, i) => { const isPeak = dayCounts[i] === maxDay && dayCounts[i] > 0; return <div key={day} className="flex-1 flex flex-col items-center gap-1.5"><div style={{ height: '52px', display: 'flex', alignItems: 'flex-end', width: '100%' }}><div style={{ width: '100%', height: dayCounts[i] > 0 ? `${Math.max(5, Math.round((dayCounts[i] / maxDay) * 52))}px` : '4px', background: isPeak ? 'var(--wine)' : dayCounts[i] > 0 ? 'var(--cream-dark)' : 'rgba(0,0,0,0.04)', borderRadius: '2px' }} /></div><span style={{ fontSize: '0.58rem', color: isPeak ? 'var(--wine)' : 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{day}</span>{dayCounts[i] > 0 && <span style={{ fontSize: '0.58rem', color: isPeak ? 'var(--wine)' : 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{dayCounts[i]}</span>}</div> })}</div></div></section>}

            {staffCounts.length > 0 && <section><SectionLabel>Team Activity</SectionLabel><div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>{staffCounts.map(([name, count], i) => <div key={name} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? '1px solid var(--cream-dark)' : undefined }}><span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', minWidth: '14px' }}>{i + 1}</span><span className="flex-1 text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>{name}</span><div style={{ width: '60px', height: '3px', background: 'var(--cream-dark)', borderRadius: '2px' }}><div style={{ width: `${Math.round((count / maxStaff) * 100)}%`, height: '100%', background: 'var(--wine)', borderRadius: '2px' }} /></div><span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', minWidth: '24px', textAlign: 'right' }}>{count}</span></div>)}</div></section>}
          </>
        )}
      </div>
    </main>
  )
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return <div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1rem' }}><p style={{ fontSize: '0.58rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.35rem' }}>{label}</p><p className="font-serif" style={{ fontSize: '2rem', fontWeight: 300, color, lineHeight: 1, marginBottom: '0.3rem' }}>{value}</p><p style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{sub}</p></div>
}
function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="font-serif" style={{ fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.6rem' }}>{children}</p>
}
function BarRow({ rank, name, sub, count, max, barColor, badge, badgeUrgent }: { rank: number; name: string; sub: string; count: number; max: number; barColor: string; badge?: string; badgeUrgent?: boolean }) {
  const pct = Math.max(3, Math.round((count / max) * 100))
  return <div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '0.75rem 1rem' }}><div className="flex items-start justify-between gap-2 mb-2"><div className="flex items-start gap-2 flex-1 min-w-0"><span style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', minWidth: '14px', paddingTop: '2px' }}>{rank}</span><div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 flex-wrap"><span style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem' }}>{name}</span>{badge && <span style={{ fontSize: '0.52rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '1px 5px', borderRadius: '2px', background: badgeUrgent ? 'rgba(193,113,79,0.12)' : 'rgba(196,168,130,0.2)', color: badgeUrgent ? 'var(--terra)' : '#7A5A30', fontFamily: 'var(--font-dm-sans)' }}>{badge}</span>}</div><span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{sub}</span></div></div><span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: barColor, fontWeight: 500, flexShrink: 0 }}>{count}×</span></div><div style={{ height: '3px', background: 'var(--cream-dark)', borderRadius: '2px', overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '2px', transition: 'width 0.4s ease' }} /></div></div>
}
