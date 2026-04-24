'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category, Item } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

type ItemWithCategory = Item & { category: Category }
type Tab = 'order' | 'make'

export default function StaffPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ItemWithCategory[]>([])
  const [tab, setTab] = useState<Tab>('order')
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [urgency, setUrgency] = useState<Record<string, 'urgent' | 'normal'>>({})
  const [staffName, setStaffName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<Tab | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('staffName')
    if (saved) { setStaffName(saved); setNameSet(true) }
    loadData()
  }, [])

  async function loadData() {
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    const { data: its } = await supabase
      .from('items')
      .select('*, category:categories(*)')
      .eq('is_active', true)

    if (cats) setCategories(cats)
    if (its) {
      setItems(its as ItemWithCategory[])
      // Pre-flag weekly items on the order tab
      const weeklyIds = (its as ItemWithCategory[])
        .filter(i => i.is_weekly && i.can_order)
        .map(i => i.id)
      if (weeklyIds.length > 0) {
        setFlagged(prev => new Set([...prev, ...weeklyIds]))
      }
    }
    setLoading(false)
  }

  function toggleFlag(itemId: string) {
    setFlagged(prev => {
      const next = new Set(prev)
      next.has(itemId) ? next.delete(itemId) : next.add(itemId)
      return next
    })
  }

  function saveName() {
    if (!staffName.trim()) return
    localStorage.setItem('staffName', staffName.trim())
    setNameSet(true)
  }

  async function submitOrder() {
    if (flagged.size === 0) return
    setSubmitting(true)
    const inserts = Array.from(flagged).map(itemId => ({
      item_id: itemId,
      flagged_by: staffName,
      note: notes[itemId] || null,
      status: 'pending',
    }))
    await supabase.from('flags').insert(inserts)
    setFlagged(new Set())
    setNotes({})
    setSubmitted('order')
    setSubmitting(false)
    setTimeout(() => setSubmitted(null), 3000)
  }

  async function submitMake() {
    if (flagged.size === 0) return
    setSubmitting(true)
    const inserts = Array.from(flagged).map(itemId => ({
      item_id: itemId,
      flagged_by: staffName,
      note: notes[itemId] || null,
      urgency: urgency[itemId] || 'normal',
      status: 'pending',
    }))
    await supabase.from('tasks').insert(inserts)
    setFlagged(new Set())
    setNotes({})
    setUrgency({})
    setSubmitted('make')
    setSubmitting(false)
    setTimeout(() => setSubmitted(null), 3000)
  }

  if (!nameSet) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--wine-dark)' }}>
        <div className="w-full max-w-sm">
          <p className="font-display italic text-2xl mb-1" style={{ color: 'var(--gold)' }}>The Cellar</p>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--cream)' }}>What&apos;s your name?</h1>
          <p className="mb-8 text-sm" style={{ color: '#9A7A72' }}>So the owner knows who flagged it.</p>
          <input
            className="w-full rounded-2xl px-4 py-4 text-lg focus:outline-none"
            style={{ background: 'var(--wine-mid)', border: '1px solid #4A2030', color: 'var(--cream)' }}
            placeholder="Your name"
            value={staffName}
            onChange={e => setStaffName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            autoFocus
          />
          <button
            onClick={saveName}
            className="mt-3 w-full py-4 rounded-2xl text-base font-semibold tracking-wide"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            Let&apos;s go
          </button>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--cream)' }}>
        <div className="text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl"
            style={{ background: submitted === 'order' ? 'var(--wine)' : 'var(--gold)', color: 'var(--cream)' }}
          >✓</div>
          <h2 className="font-display text-2xl font-bold italic" style={{ color: 'var(--text)' }}>
            {submitted === 'order' ? 'Board updated!' : 'Kitchen notified!'}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            {submitted === 'order' ? 'The owner has been notified.' : 'Task added to the kitchen queue.'}
          </p>
          <button
            onClick={() => setSubmitted(null)}
            className="mt-8 px-8 py-3 rounded-2xl font-medium text-sm"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            Flag more items
          </button>
        </div>
      </main>
    )
  }

  const visibleItems = items.filter(i => tab === 'order' ? i.can_order : i.can_make)
  const weeklyItems = tab === 'order' ? visibleItems.filter(i => i.is_weekly) : []
  const nonWeeklyItems = tab === 'order' ? visibleItems.filter(i => !i.is_weekly) : visibleItems
  const itemsByCategory = categories.map(cat => ({
    category: cat,
    items: nonWeeklyItems.filter(i => i.category_id === cat.id),
  })).filter(g => g.items.length > 0)

  const accentColor = tab === 'order' ? 'red' : 'amber'

  return (
    <main className="min-h-screen pb-36" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="sticky top-0 backdrop-blur border-b px-4 py-3 z-10"
        style={{ background: 'rgba(247,241,232,0.95)', borderColor: 'var(--cream-dark)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/cellar-logo.svg" alt="The Cellar" width={36} height={19}
                style={{ filter: 'brightness(0)', opacity: 0.7 }} />
              <h1 className="font-display italic text-lg font-bold" style={{ color: 'var(--text)' }}>Inventory Board</h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Hey {staffName} 👋</p>
          </div>
          <Link href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Back</Link>
        </div>
        <div className="flex rounded-2xl overflow-hidden p-1 gap-1" style={{ background: 'var(--cream-dark)' }}>
          <button
            onClick={() => { setTab('order'); setFlagged(new Set()); setNotes({}) }}
            className="font-label flex-1 py-2 text-base tracking-widest rounded-xl transition-all"
            style={tab === 'order'
              ? { background: 'var(--wine)', color: 'var(--cream)' }
              : { color: 'var(--muted)' }}
          >
            Needs Reorder
          </button>
          <button
            onClick={() => { setTab('make'); setFlagged(new Set()); setNotes({}) }}
            className="font-label flex-1 py-2 text-base tracking-widest rounded-xl transition-all"
            style={tab === 'make'
              ? { background: 'var(--gold)', color: 'var(--wine-dark)' }
              : { color: 'var(--muted)' }}
          >
            Needs Making
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {tab === 'make' && (
          <p className="text-xs rounded-2xl px-4 py-3" style={{ background: 'var(--cream-dark)', color: 'var(--muted)' }}>
            These go straight to the kitchen queue.
          </p>
        )}

        {weeklyItems.length > 0 && (
          <div>
            <p className="font-label text-base tracking-widest mb-2 px-1" style={{ color: 'var(--gold)' }}>
              Weekly Staples
            </p>
            <div className="space-y-2">
              {weeklyItems.map(item => {
                const isFlagged = flagged.has(item.id)
                return (
                  <div key={item.id} className="rounded-2xl overflow-hidden transition-all"
                    style={isFlagged
                      ? { background: 'var(--wine-dark)', boxShadow: '0 2px 12px rgba(28,10,18,0.15)' }
                      : { background: 'white', border: '1px solid var(--cream-dark)' }}>
                    <button onClick={() => toggleFlag(item.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                      <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all"
                        style={isFlagged
                          ? { background: 'var(--gold)', borderColor: 'var(--gold)', color: 'var(--wine-dark)' }
                          : { borderColor: 'var(--gold)' }}>
                        {isFlagged ? '!' : ''}
                      </span>
                      <span className="text-base font-medium flex-1" style={{ color: isFlagged ? 'var(--cream)' : 'var(--text)' }}>
                        {item.name}
                      </span>
                      <span className="text-xs font-semibold tracking-wide" style={{ color: isFlagged ? 'var(--gold)' : 'var(--gold)' }}>
                        {isFlagged ? 'LOW' : 'weekly'}
                      </span>
                    </button>
                    {isFlagged && (
                      <div className="px-4 pb-3.5">
                        <input
                          className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                          style={{ background: 'var(--wine-mid)', border: '1px solid #4A2030', color: 'var(--cream)' }}
                          placeholder="Add a note (optional)"
                          value={notes[item.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {itemsByCategory.map(({ category, items: catItems }) => (
          <div key={category.id}>
            <p className="font-label text-base tracking-widest mb-2 px-1" style={{ color: 'var(--muted)' }}>
              {category.name}
            </p>
            <div className="space-y-2">
              {catItems.map(item => {
                const isFlagged = flagged.has(item.id)
                const isUrgent = urgency[item.id] === 'urgent'
                const flaggedBg = tab === 'order' ? 'var(--wine)' : 'var(--gold)'
                const flaggedText = tab === 'order' ? 'var(--cream)' : 'var(--wine-dark)'
                return (
                  <div key={item.id} className="rounded-2xl overflow-hidden transition-all"
                    style={isFlagged
                      ? { background: flaggedBg, boxShadow: '0 2px 12px rgba(28,10,18,0.15)' }
                      : { background: 'white', border: '1px solid var(--cream-dark)' }}>
                    <button onClick={() => toggleFlag(item.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                      <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all"
                        style={isFlagged
                          ? { background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)', color: flaggedText }
                          : { borderColor: 'rgba(255,255,255,0.2)' }}>
                        {isFlagged ? '!' : ''}
                      </span>
                      <span className="text-base font-medium flex-1" style={{ color: isFlagged ? flaggedText : 'var(--text)' }}>
                        {item.name}
                      </span>
                      {isFlagged && (
                        <span className="text-xs font-semibold tracking-wide" style={{ color: tab === 'order' ? 'rgba(247,241,232,0.7)' : 'rgba(28,10,18,0.6)' }}>
                          {tab === 'order' ? 'LOW' : 'MAKE'}
                        </span>
                      )}
                    </button>
                    {isFlagged && (
                      <div className="px-4 pb-3.5 space-y-2">
                        <input
                          className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                          style={tab === 'order'
                            ? { background: 'var(--wine-mid)', border: '1px solid #4A2030', color: 'var(--cream)' }
                            : { background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)', color: 'var(--wine-dark)' }}
                          placeholder={tab === 'make' ? 'Quantity or note (e.g. "1 batch")' : 'Add a note (optional)'}
                          value={notes[item.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        />
                        {tab === 'make' && (
                          <button
                            onClick={() => setUrgency(prev => ({ ...prev, [item.id]: isUrgent ? 'normal' : 'urgent' }))}
                            className="text-xs px-4 py-1.5 rounded-full font-semibold transition-colors"
                            style={isUrgent
                              ? { background: 'var(--wine)', color: 'var(--cream)' }
                              : { background: 'rgba(255,255,255,0.4)', color: 'var(--wine-dark)' }}
                          >
                            {isUrgent ? '🔴 URGENT — tap to undo' : 'Mark urgent'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {itemsByCategory.length === 0 && weeklyItems.length === 0 && (
          <div className="text-center py-20">
            <p style={{ color: 'var(--muted)' }}>No items set up yet.</p>
            <Link href="/admin" className="underline mt-2 block text-sm font-medium" style={{ color: 'var(--wine)' }}>Configure in Admin</Link>
          </div>
        )}
      </div>

      {flagged.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
          style={{ background: 'linear-gradient(to top, var(--cream) 70%, transparent)' }}>
          <button
            onClick={tab === 'order' ? submitOrder : submitMake}
            disabled={submitting}
            className="font-label w-full py-4 rounded-2xl text-xl tracking-widest disabled:opacity-50 shadow-lg"
            style={tab === 'order'
              ? { background: 'var(--wine)', color: 'var(--cream)' }
              : { background: 'var(--gold)', color: 'var(--wine-dark)' }}
          >
            {submitting
              ? 'Submitting...'
              : tab === 'order'
                ? `Flag ${flagged.size} item${flagged.size > 1 ? 's' : ''} for reorder`
                : `Send ${flagged.size} item${flagged.size > 1 ? 's' : ''} to kitchen`
            }
          </button>
        </div>
      )}
    </main>
  )
}
