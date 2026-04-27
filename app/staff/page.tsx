'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category, Item } from '@/lib/supabase'
import Link from 'next/link'

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
          <p className="font-serif text-base mb-1" style={{ color: 'var(--gold)', letterSpacing: '0.3em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            The Cellar
          </p>
          <h1 className="font-serif mb-2" style={{ fontSize: '2.2rem', fontWeight: 300, color: 'var(--cream)', lineHeight: 1.2 }}>
            What&apos;s your name?
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            So the owner knows who flagged it.
          </p>
          <input
            className="w-full px-4 py-4 text-base focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(196,168,130,0.25)',
              color: 'var(--cream)',
              borderRadius: '4px',
              fontFamily: 'var(--font-dm-sans)',
            }}
            placeholder="Your name"
            value={staffName}
            onChange={e => setStaffName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            autoFocus
          />
          <button
            onClick={saveName}
            className="mt-3 w-full py-4 text-sm tracking-widest uppercase"
            style={{
              background: 'var(--wine)',
              color: 'var(--cream)',
              borderRadius: '4px',
              fontFamily: 'var(--font-dm-sans)',
              letterSpacing: '0.2em',
            }}
          >
            Enter
          </button>
        </div>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '1.1rem' }}>
          a moment...
        </p>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--cream)' }}>
        <div className="text-center">
          <div
            className="w-14 h-14 flex items-center justify-center mx-auto mb-6 text-xl"
            style={{
              border: `1px solid ${submitted === 'order' ? 'var(--wine)' : 'var(--gold)'}`,
              color: submitted === 'order' ? 'var(--wine)' : '#7A5A30',
              borderRadius: '50%',
            }}
          >
            ✓
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--text)', letterSpacing: '0.01em' }}>
            {submitted === 'order' ? 'Board updated.' : 'Kitchen notified.'}
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            {submitted === 'order' ? 'The owner has been notified.' : 'Task added to the kitchen queue.'}
          </p>
          <button
            onClick={() => setSubmitted(null)}
            className="mt-8 px-8 py-3 text-xs tracking-widest uppercase"
            style={{
              border: '1px solid var(--wine)',
              color: 'var(--wine)',
              background: 'transparent',
              borderRadius: '4px',
              fontFamily: 'var(--font-dm-sans)',
              letterSpacing: '0.2em',
            }}
          >
            Flag more
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

  const isOrder = tab === 'order'
  const flaggedActiveBg = isOrder ? 'var(--wine)' : '#7A5A30'
  const flaggedActiveText = 'var(--cream)'
  const flaggedInputBg = isOrder ? 'var(--wine-mid)' : 'rgba(122,90,48,0.3)'
  const flaggedInputBorder = isOrder ? 'rgba(196,168,130,0.2)' : 'rgba(196,168,130,0.3)'

  return (
    <main className="min-h-screen pb-36" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div
        className="sticky top-0 backdrop-blur border-b px-4 py-3 z-10"
        style={{ background: 'rgba(245,239,224,0.96)', borderColor: 'var(--cream-dark)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)', letterSpacing: '0.01em' }}>
              Inventory Board
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.05em' }}>
              {staffName}
            </p>
          </div>
          <Link href="/" className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>
            ← Back
          </Link>
        </div>
        <div className="flex overflow-hidden gap-px" style={{ background: 'var(--cream-dark)', borderRadius: '4px', padding: '3px', gap: '3px' }}>
          <button
            onClick={() => { setTab('order'); setFlagged(new Set()); setNotes({}) }}
            className="flex-1 py-2.5 text-xs tracking-widest uppercase transition-all"
            style={tab === 'order'
              ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }
              : { color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }}
          >
            Needs Reorder
          </button>
          <button
            onClick={() => { setTab('make'); setFlagged(new Set()); setNotes({}) }}
            className="flex-1 py-2.5 text-xs tracking-widest uppercase transition-all"
            style={tab === 'make'
              ? { background: '#7A5A30', color: 'var(--cream)', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }
              : { color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }}
          >
            Needs Making
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-6">
        {tab === 'make' && (
          <p className="text-xs px-4 py-3" style={{ background: 'var(--cream-dark)', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', borderRadius: '4px', letterSpacing: '0.05em' }}>
            These go straight to the kitchen queue.
          </p>
        )}

        {weeklyItems.length > 0 && (
          <div>
            <p className="font-serif mb-2 px-1" style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#7A5A30' }}>
              Weekly Staples
            </p>
            <div className="space-y-1.5">
              {weeklyItems.map(item => {
                const isFlagged = flagged.has(item.id)
                return (
                  <div
                    key={item.id}
                    className="overflow-hidden transition-all"
                    style={isFlagged
                      ? { background: 'var(--wine-dark)', borderRadius: '4px' }
                      : { background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}
                  >
                    <button onClick={() => toggleFlag(item.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                      <span
                        className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-xs transition-all"
                        style={isFlagged
                          ? { border: '1px solid var(--gold)', color: 'var(--gold)' }
                          : { border: '1px solid var(--gold)', color: 'transparent' }}
                      >
                        {isFlagged ? '·' : ''}
                      </span>
                      <span className="text-sm flex-1" style={{ color: isFlagged ? 'var(--cream)' : 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>
                        {item.name}
                      </span>
                      <span className="text-xs tracking-widest uppercase" style={{ color: isFlagged ? 'var(--gold)' : 'var(--gold)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.6rem' }}>
                        {isFlagged ? 'low' : 'weekly'}
                      </span>
                    </button>
                    {isFlagged && (
                      <div className="px-4 pb-3.5">
                        <input
                          className="w-full text-sm px-3 py-2 focus:outline-none"
                          style={{ background: flaggedInputBg, border: `1px solid ${flaggedInputBorder}`, color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)' }}
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
            <p className="font-serif mb-2 px-1" style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              {category.name}
            </p>
            <div className="space-y-1.5">
              {catItems.map(item => {
                const isFlagged = flagged.has(item.id)
                const isUrgent = urgency[item.id] === 'urgent'
                return (
                  <div
                    key={item.id}
                    className="overflow-hidden transition-all"
                    style={isFlagged
                      ? { background: flaggedActiveBg, borderRadius: '4px' }
                      : { background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}
                  >
                    <button onClick={() => toggleFlag(item.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                      <span
                        className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-xs transition-all"
                        style={isFlagged
                          ? { border: '1px solid rgba(245,239,224,0.5)', color: 'var(--cream)' }
                          : { border: '1px solid var(--cream-dark)' }}
                      >
                        {isFlagged ? '·' : ''}
                      </span>
                      <span className="text-sm flex-1" style={{ color: isFlagged ? flaggedActiveText : 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>
                        {item.name}
                      </span>
                      {isFlagged && (
                        <span className="text-xs uppercase tracking-widest" style={{ color: 'rgba(245,239,224,0.6)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                          {isOrder ? 'low' : 'make'}
                        </span>
                      )}
                    </button>
                    {isFlagged && (
                      <div className="px-4 pb-3.5 space-y-2">
                        <input
                          className="w-full text-sm px-3 py-2 focus:outline-none"
                          style={{ background: flaggedInputBg, border: `1px solid ${flaggedInputBorder}`, color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)' }}
                          placeholder={tab === 'make' ? 'Quantity or note (e.g. "1 batch")' : 'Add a note (optional)'}
                          value={notes[item.id] || ''}
                          onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                        />
                        {tab === 'make' && (
                          <button
                            onClick={() => setUrgency(prev => ({ ...prev, [item.id]: isUrgent ? 'normal' : 'urgent' }))}
                            className="text-xs px-4 py-1.5 transition-colors uppercase tracking-widest"
                            style={isUrgent
                              ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em' }
                              : { background: 'rgba(255,255,255,0.2)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em' }}
                          >
                            {isUrgent ? '· urgent — undo' : 'mark urgent'}
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
            <p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '1.1rem' }}>Nothing set up yet.</p>
            <Link href="/admin" className="underline mt-2 block text-xs tracking-widest uppercase" style={{ color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>
              Configure in Admin
            </Link>
          </div>
        )}
      </div>

      {flagged.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4"
          style={{ background: 'linear-gradient(to top, var(--cream) 65%, transparent)' }}>
          <button
            onClick={tab === 'order' ? submitOrder : submitMake}
            disabled={submitting}
            className="w-full py-4 text-xs tracking-widest uppercase disabled:opacity-50"
            style={{
              background: isOrder ? 'var(--wine)' : '#7A5A30',
              color: 'var(--cream)',
              borderRadius: '4px',
              fontFamily: 'var(--font-dm-sans)',
              letterSpacing: '0.2em',
            }}
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
