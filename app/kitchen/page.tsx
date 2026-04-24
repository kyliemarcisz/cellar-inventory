'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export default function KitchenPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*, item:items(*, category:categories(*))')
      .in('status', ['pending', 'in_progress'])
      .order('urgency', { ascending: false })
      .order('flagged_at', { ascending: true })

    if (data) setTasks(data as Task[])
    setLoading(false)
  }

  async function updateStatus(taskId: string, status: 'in_progress' | 'done') {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    if (status === 'done') {
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#1C0A12] flex items-center justify-center">
        <p className="text-stone-500 text-lg">Loading...</p>
      </main>
    )
  }

  const urgent = tasks.filter(t => t.urgency === 'urgent')
  const normal = tasks.filter(t => t.urgency === 'normal')

  return (
    <main className="min-h-screen bg-[#1C0A12] pb-12">
      <div className="sticky top-0 bg-[#1C0A12]/90 backdrop-blur border-b border-[#3D1220] px-4 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Image src="/cellar-logo.svg" alt="The Cellar" width={32} height={17}
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.5 }} />
            <h1 className="text-xl font-bold text-white">Kitchen Queue</h1>
          </div>
          <p className={`text-sm mt-0.5 ${tasks.length === 0 ? 'text-green-400' : 'text-amber-400'}`}>
            {tasks.length === 0 ? 'All clear ✓' : `${tasks.length} item${tasks.length > 1 ? 's' : ''} to prepare`}
          </p>
        </div>
        <Link href="/" className="text-stone-600 text-sm">← Home</Link>
      </div>

      <div className="px-4 pt-6 space-y-8">
        {tasks.length === 0 && (
          <div className="text-center py-28">
            <div className="w-20 h-20 bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl text-green-400">✓</div>
            <p className="text-white text-2xl font-bold">All caught up</p>
            <p className="text-stone-500 mt-2">Nothing needs to be made right now.</p>
          </div>
        )}

        {urgent.length > 0 && (
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">
              🔴 Urgent
            </p>
            <div className="space-y-3">
              {urgent.map(task => (
                <TaskCard key={task.id} task={task} onUpdate={updateStatus} />
              ))}
            </div>
          </div>
        )}

        {normal.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
              Queue
            </p>
            <div className="space-y-3">
              {normal.map(task => (
                <TaskCard key={task.id} task={task} onUpdate={updateStatus} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function TaskCard({ task, onUpdate }: {
  task: Task
  onUpdate: (id: string, status: 'in_progress' | 'done') => void
}) {
  const item = task.item as any
  const isInProgress = task.status === 'in_progress'
  const isUrgent = task.urgency === 'urgent'

  return (
    <div className={`rounded-2xl overflow-hidden ${
      isUrgent ? 'bg-[#3D0A14] border border-[#6B1020]' : 'bg-[#2D0F1A] border border-[#4A1828]'
    }`}>
      {isInProgress && (
        <div className="h-1 bg-amber-500 w-full" />
      )}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-1">
          {isInProgress && (
            <span className="text-xs font-bold text-amber-400 bg-amber-900/50 px-2.5 py-0.5 rounded-full">
              IN PROGRESS
            </span>
          )}
          <span className="text-xs text-stone-500">
            {item?.category?.name} · {task.flagged_by} · {getTimeAgo(task.flagged_at)}
          </span>
        </div>

        <p className="text-white text-3xl font-bold tracking-tight">{item?.name}</p>

        {task.note && (
          <p className="text-amber-300 text-sm mt-2 italic">&quot;{task.note}&quot;</p>
        )}

        <div className="flex gap-2 mt-4">
          {!isInProgress && (
            <button
              onClick={() => onUpdate(task.id, 'in_progress')}
              className="flex-1 py-3 rounded-xl text-base font-semibold" style={{ background: 'var(--gold)', color: 'var(--wine-dark)' }}
            >
              Start
            </button>
          )}
          <button
            onClick={() => onUpdate(task.id, 'done')}
            className={`py-3 rounded-xl text-base font-semibold ${
              isInProgress
                ? 'flex-1 bg-white text-[#1C0A12]'
                : 'px-6 bg-[#3D1220] text-white'
            }`}
          >
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
