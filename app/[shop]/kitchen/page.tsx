'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import type { Task, EightySix } from '@/lib/supabase'
import Link from 'next/link'

export default function KitchenPage() {
  const { shopId, itemIds, loading: shopLoading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()
  const [tasks, setTasks] = useState<Task[]>([])
  const [eightySixes, setEightySixes] = useState<EightySix[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (shopLoading) return
    loadTasks()
    loadEightySixes()

    const channel = supabase
      .channel('kitchen-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadTasks())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eighty_sixes' }, () => loadEightySixes())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopLoading, shopId])

  async function loadEightySixes() {
    if (!shopId) return
    const { data } = await supabase.from('eighty_sixes').select('*').eq('shop_id', shopId).eq('is_active', true).order('marked_at', { ascending: false })
    if (data) setEightySixes(data as EightySix[])
  }

  async function loadTasks() {
    if (!shopId) { setTasks([]); setLoading(false); return }
    const { data: cats } = await supabase.from('categories').select('id').eq('shop_id', shopId)
    const freshCatIds = cats?.map((c: { id: string }) => c.id) || []
    if (freshCatIds.length === 0) { setTasks([]); setLoading(false); return }
    const { data: freshItems } = await supabase.from('items').select('id').in('category_id', freshCatIds)
    const freshItemIds = freshItems?.map((i: { id: string }) => i.id) || []
    if (freshItemIds.length === 0) { setTasks([]); setLoading(false); return }

    const { data } = await supabase
      .from('tasks')
      .select('*, item:items(*, category:categories(*))')
      .in('item_id', freshItemIds)
      .in('status', ['pending', 'in_progress'])
      .order('urgency', { ascending: false })
      .order('flagged_at', { ascending: true })
    if (data) setTasks(data as Task[])
    setLoading(false)
  }

  async function updateStatus(taskId: string, status: 'in_progress' | 'done') {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (status === 'done') setTasks(prev => prev.filter(t => t.id !== taskId))
    else setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  if (notFound || shopLoading || loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--wine-dark)' }}>
      <p className="font-serif" style={{ color: 'var(--gold)', fontStyle: 'italic', fontSize: '1.1rem' }}>{notFound ? 'Shop not found.' : 'a moment...'}</p>
    </main>
  )

  const urgent = tasks.filter(t => t.urgency === 'urgent')
  const normal = tasks.filter(t => t.urgency === 'normal')

  return (
    <main className="min-h-screen pb-12" style={{ background: 'var(--wine-dark)' }}>
      <div className="sticky top-0 backdrop-blur border-b px-4 py-4 flex items-center justify-between" style={{ background: 'rgba(30,20,16,0.94)', borderColor: 'rgba(196,168,130,0.12)' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--cream)' }}>Kitchen Queue</h1>
          <p className="text-xs mt-0.5 uppercase tracking-widest" style={{ color: tasks.length === 0 ? 'var(--muted)' : 'var(--terra)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', letterSpacing: '0.2em' }}>
            {tasks.length === 0 ? 'all clear' : `${tasks.length} to prepare`}
          </p>
        </div>
        <Link href={`/${slug}`} className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>← Home</Link>
      </div>

      <div className="px-4 pt-6 space-y-8">
        {eightySixes.length > 0 && (
          <div style={{ background: '#2A1010', border: '1px solid rgba(193,113,79,0.35)', borderRadius: '4px', padding: '0.875rem 1.1rem' }}>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.6rem' }}>
              Out of Stock · {eightySixes.length}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {eightySixes.map(e => (
                <div key={e.id} style={{ padding: '4px 10px', background: 'rgba(193,113,79,0.15)', border: '1px solid rgba(193,113,79,0.3)', borderRadius: '2px' }}>
                  <span style={{ color: 'var(--cream)', fontSize: '0.82rem', fontFamily: 'var(--font-dm-sans)' }}>{e.item_name}</span>
                  {e.note && <span style={{ color: 'var(--muted)', fontSize: '0.72rem', fontFamily: 'var(--font-dm-sans)' }}> · {e.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-28">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-6 text-xl" style={{ border: '1px solid rgba(196,168,130,0.3)', color: 'var(--gold)', borderRadius: '50%' }}>✓</div>
            <p className="font-serif" style={{ color: 'var(--cream)', fontSize: '1.8rem', fontWeight: 300 }}>All caught up.</p>
            <p className="text-sm mt-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Nothing needs to be made right now.</p>
          </div>
        )}
        {urgent.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Urgent</p>
            <div className="space-y-2.5">{urgent.map(task => <TaskCard key={task.id} task={task} onUpdate={updateStatus} />)}</div>
          </div>
        )}
        {normal.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Queue</p>
            <div className="space-y-2.5">{normal.map(task => <TaskCard key={task.id} task={task} onUpdate={updateStatus} />)}</div>
          </div>
        )}
      </div>
    </main>
  )
}

function TaskCard({ task, onUpdate }: { task: Task; onUpdate: (id: string, status: 'in_progress' | 'done') => void }) {
  const item = task.item as any
  const isInProgress = task.status === 'in_progress'
  const isUrgent = task.urgency === 'urgent'

  return (
    <div style={isUrgent ? { background: '#2A1410', border: '1px solid rgba(193,113,79,0.3)', borderRadius: '4px', overflow: 'hidden' } : { background: '#251810', border: '1px solid rgba(196,168,130,0.12)', borderRadius: '4px', overflow: 'hidden' }}>
      {isInProgress && <div style={{ height: '2px', background: 'var(--gold)', width: '100%' }} />}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-2">
          {isInProgress && <span className="text-xs uppercase tracking-widest px-2 py-0.5" style={{ color: 'var(--gold)', border: '1px solid rgba(196,168,130,0.3)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.58rem', borderRadius: '2px' }}>In Progress</span>}
          <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{item?.category?.name} · {task.flagged_by} · {getTimeAgo(task.flagged_at)}</span>
        </div>
        <p className="font-serif" style={{ fontSize: '2.4rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.1 }}>{item?.name}</p>
        {task.note && <p className="text-sm mt-2 italic" style={{ color: 'var(--gold)', fontFamily: 'var(--font-dm-sans)' }}>&quot;{task.note}&quot;</p>}
        <div className="flex gap-2 mt-4">
          {!isInProgress && <button onClick={() => onUpdate(task.id, 'in_progress')} className="flex-1 py-3 text-xs uppercase tracking-widest" style={{ background: 'var(--terra)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>Start</button>}
          <button onClick={() => onUpdate(task.id, 'done')} className={`py-3 text-xs uppercase tracking-widest ${isInProgress ? 'flex-1' : 'px-6'}`}
            style={isInProgress ? { background: 'var(--cream)', color: 'var(--wine-dark)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' } : { border: '1px solid rgba(196,168,130,0.2)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
            {isInProgress ? 'Done ✓' : 'Done'}
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
