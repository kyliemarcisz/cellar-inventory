'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import type { Flag, EightySix } from '@/lib/supabase'
import Link from 'next/link'

type FlagWithSupplier = Flag & { item: { name: string; category: { name: string; supplier_name: string | null; supplier_email: string | null } } }
type BelowParItem = { id: string; name: string; par_level: number; par_unit: string; current_qty: number; category_name: string; counted_by: string; counted_at: string; supplier_email: string | null; supplier_name: string | null }
type DraftItem = { flagId: string; itemName: string; note: string; flaggedBy: string; supplierEmail: string | null; supplierName: string | null }
type OrderRecord = { id: string; supplier_name: string; supplier_email: string; items: { name: string; note: string | null; flaggedBy: string }[]; created_at: string }

export default function OwnerPage() {
  const { shop, shopId, itemIds, loading: shopLoading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()
  const [flags, setFlags] = useState<FlagWithSupplier[]>([])
  const [belowPar, setBelowPar] = useState<BelowParItem[]>([])
  const [eightySixes, setEightySixes] = useState<EightySix[]>([])
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [emailsSent, setEmailsSent] = useState<Set<string>>(new Set())
  const [emailError, setEmailError] = useState<string | null>(null)
  const [orderDraft, setOrderDraft] = useState<DraftItem[] | null>(null)
  const [confirmSending, setConfirmSending] = useState(false)
  const [emailDrafts, setEmailDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (shopLoading) return
    loadFlags(); loadBelowPar(); loadEightySixes(); loadOrders()
    const channel = supabase.channel('owner-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flags' }, () => loadFlags())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eighty_sixes' }, () => loadEightySixes())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopLoading, shopId])

  async function getFreshItemIds(): Promise<string[]> {
    if (!shopId) return []
    const { data: cats } = await supabase.from('categories').select('id').eq('shop_id', shopId)
    const freshCatIds = cats?.map((c: { id: string }) => c.id) || []
    if (!freshCatIds.length) return []
    const { data: its } = await supabase.from('items').select('id').in('category_id', freshCatIds)
    return its?.map((i: { id: string }) => i.id) || []
  }

  async function loadEightySixes() {
    if (!shopId) return
    const { data } = await supabase.from('eighty_sixes').select('*').eq('shop_id', shopId).eq('is_active', true).order('marked_at', { ascending: false })
    if (data) setEightySixes(data as EightySix[])
  }

  async function loadOrders() {
    if (!shopId) return
    const { data } = await supabase.from('orders').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }).limit(20)
    if (data) setRecentOrders(data as OrderRecord[])
  }

  async function loadBelowPar() {
    const freshItemIds = await getFreshItemIds()
    if (!freshItemIds.length) { setBelowPar([]); return }
    const { data: items } = await supabase.from('items')
      .select('id, name, par_level, par_unit, category:categories(name, supplier_name, supplier_email)')
      .in('id', freshItemIds).not('par_level', 'is', null).eq('is_active', true)
    if (!items?.length) { setBelowPar([]); return }
    const { data: counts } = await supabase.from('inventory_counts')
      .select('item_id, quantity, counted_by, counted_at').in('item_id', items.map(i => i.id)).order('counted_at', { ascending: false })
    const latestCount: Record<string, { quantity: number; counted_by: string; counted_at: string }> = {}
    for (const c of counts || []) { if (!latestCount[c.item_id]) latestCount[c.item_id] = { quantity: c.quantity, counted_by: c.counted_by, counted_at: c.counted_at } }
    const below: BelowParItem[] = []
    for (const item of items) {
      const count = latestCount[item.id]
      if (!count) continue
      const cat = item.category as unknown as { name: string; supplier_name: string | null; supplier_email: string | null }
      if (count.quantity < (item.par_level as number)) {
        below.push({ id: item.id, name: item.name, par_level: item.par_level as number, par_unit: item.par_unit || 'units', current_qty: count.quantity, category_name: cat?.name || '', counted_by: count.counted_by, counted_at: count.counted_at, supplier_email: cat?.supplier_email || null, supplier_name: cat?.supplier_name || null })
      }
    }
    setBelowPar(below)
  }

  async function loadFlags() {
    const freshItemIds = await getFreshItemIds()
    if (!freshItemIds.length) { setFlags([]); setLoading(false); return }
    const { data } = await supabase.from('flags')
      .select('*, item:items(name, category:categories(name, supplier_name, supplier_email))')
      .in('item_id', freshItemIds).in('status', ['pending', 'ordered']).order('flagged_at', { ascending: false })
    if (data) setFlags(data as FlagWithSupplier[])
    setLoading(false)
  }

  function openOrderDraft(flagsToOrder: FlagWithSupplier[]) {
    const draft = flagsToOrder.map(f => ({
      flagId: f.id,
      itemName: f.item?.name || '',
      note: f.note || '',
      flaggedBy: f.flagged_by,
      supplierEmail: f.item?.category?.supplier_email || null,
      supplierName: f.item?.category?.supplier_name || null,
    }))
    setOrderDraft(draft)
    setEmailDrafts({})

    // Group by supplier and auto-generate a draft email for each
    const bySupplier = new Map<string, { name: string; items: DraftItem[] }>()
    for (const item of draft) {
      if (!item.supplierEmail) continue
      if (!bySupplier.has(item.supplierEmail)) bySupplier.set(item.supplierEmail, { name: item.supplierName || item.supplierEmail, items: [] })
      bySupplier.get(item.supplierEmail)!.items.push(item)
    }
    for (const [email, { name, items }] of bySupplier) {
      generateEmailDraft(email, name, items)
    }
  }

  async function generateEmailDraft(supplierEmail: string, supplierName: string, items: DraftItem[]) {
    const itemsText = items.map(i => `- ${i.itemName}${i.note ? ` (${i.note})` : ''}`).join('\n')
    setEmailDrafts(prev => ({ ...prev, [supplierEmail]: '' }))
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Write a short order email from "${shop?.name || 'us'}" to "${supplierName}". We need to reorder:\n\n${itemsText}\n\nInclude a greeting, the order request, and a brief sign-off. Under 80 words. Sound like a real small restaurant owner, not a template.` }],
          systemPrompt: 'You write concise, professional supplier emails for small restaurants. Be warm and direct.',
        }),
      })
      if (!res.ok) throw new Error('failed')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setEmailDrafts(prev => ({ ...prev, [supplierEmail]: full }))
      }
    } catch {
      setEmailDrafts(prev => ({ ...prev, [supplierEmail]: `Hi ${supplierName},\n\nWe're running low on a few things at ${shop?.name || 'our restaurant'} and need to place an order.\n\nItems:\n${itemsText}\n\nCan you let us know availability?\n\nThanks,\n${shop?.name || ''}` }))
    }
  }

  function updateDraftNote(flagId: string, note: string) {
    setOrderDraft(prev => prev?.map(d => d.flagId === flagId ? { ...d, note } : d) ?? null)
  }

  function removeDraftItem(flagId: string) {
    setOrderDraft(prev => { const next = prev?.filter(d => d.flagId !== flagId) ?? []; return next.length ? next : null })
  }

  async function confirmAndSend() {
    if (!orderDraft || !shop || !shopId) return
    setConfirmSending(true)

    const bySupplier = new Map<string, { name: string; email: string; items: DraftItem[] }>()
    const noSupplier: DraftItem[] = []
    for (const item of orderDraft) {
      if (!item.supplierEmail) { noSupplier.push(item); continue }
      if (!bySupplier.has(item.supplierEmail)) bySupplier.set(item.supplierEmail, { name: item.supplierName || item.supplierEmail, email: item.supplierEmail, items: [] })
      bySupplier.get(item.supplierEmail)!.items.push(item)
    }

    const sentIds = new Set<string>()
    for (const [, supplier] of bySupplier) {
      try {
        const orderItems = supplier.items.map(i => ({ name: i.itemName, note: i.note || null, flaggedBy: i.flaggedBy }))
        await fetch('/api/send-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopName: shop.name, supplierName: supplier.name, supplierEmail: supplier.email, items: orderItems, emailBody: emailDrafts[supplier.email] || undefined }),
        })
        await supabase.from('orders').insert({ shop_id: shopId, supplier_name: supplier.name, supplier_email: supplier.email, items: orderItems })
        supplier.items.forEach(i => sentIds.add(i.flagId))
      } catch {
        setEmailError(`Failed to email ${supplier.name}`)
        setTimeout(() => setEmailError(null), 4000)
      }
    }

    const allFlagIds = orderDraft.map(d => d.flagId)
    await supabase.from('flags').update({ status: 'ordered' }).in('id', allFlagIds)
    setFlags(prev => prev.map(f => allFlagIds.includes(f.id) ? { ...f, status: 'ordered' as const } : f))
    setEmailsSent(prev => new Set([...prev, ...sentIds]))
    setTimeout(() => setEmailsSent(new Set()), 6000)
    setOrderDraft(null)
    setConfirmSending(false)
    loadOrders()
  }

  async function updateStatus(flagId: string, status: 'ordered' | 'received') {
    if (status === 'ordered') {
      const flag = flags.find(f => f.id === flagId)
      if (flag) openOrderDraft([flag])
      return
    }
    await supabase.from('flags').update({ status }).eq('id', flagId)
    setFlags(prev => prev.filter(f => f.id !== flagId))
  }

  function markAllOrdered() {
    const pending = flags.filter(f => f.status === 'pending')
    if (pending.length) openOrderDraft(pending)
  }

  async function clearEightySix(id: string) {
    await supabase.from('eighty_sixes').update({ is_active: false }).eq('id', id)
    setEightySixes(prev => prev.filter(e => e.id !== id))
  }

  async function clearAllEightySixes() {
    const ids = eightySixes.map(e => e.id)
    if (!ids.length) return
    await supabase.from('eighty_sixes').update({ is_active: false }).in('id', ids)
    setEightySixes([])
  }

  if (notFound || shopLoading || loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{notFound ? 'Shop not found.' : 'a moment...'}</p>
    </main>
  )

  const pending = flags.filter(f => f.status === 'pending')
  const ordered = flags.filter(f => f.status === 'ordered')

  // Build supplier groups for the draft modal
  const draftBySupplier = orderDraft ? (() => {
    const map = new Map<string, { name: string; items: DraftItem[] }>()
    const none: DraftItem[] = []
    for (const d of orderDraft) {
      if (!d.supplierEmail) { none.push(d); continue }
      if (!map.has(d.supplierEmail)) map.set(d.supplierEmail, { name: d.supplierName || d.supplierEmail, items: [] })
      map.get(d.supplierEmail)!.items.push(d)
    }
    return { groups: [...map.entries()].map(([email, v]) => ({ email, ...v })), none }
  })() : null

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>

      {/* ── Order Confirmation Overlay ── */}
      {orderDraft && draftBySupplier && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'var(--cream)' }}>
          <div className="sticky top-0 border-b px-4 py-4 flex items-center justify-between" style={{ background: 'rgba(245,239,224,0.97)', borderColor: 'var(--cream-dark)' }}>
            <div>
              <h2 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 300, color: 'var(--text)' }}>Review Order</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                {draftBySupplier.groups.length} supplier{draftBySupplier.groups.length !== 1 ? 's' : ''} · {orderDraft.length} item{orderDraft.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={() => setOrderDraft(null)} style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.75rem' }}>Cancel</button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-32">
            {draftBySupplier.groups.map(group => (
              <div key={group.email}>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <p className="font-serif" style={{ fontSize: '0.7rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--wine)' }}>
                    {group.name}
                  </p>
                  <span style={{ fontSize: '0.58rem', color: emailDrafts[group.email] !== undefined ? (emailDrafts[group.email] ? 'var(--gold)' : 'var(--muted)') : 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                    {emailDrafts[group.email] === undefined ? '' : emailDrafts[group.email] === '' ? 'Grace is writing…' : 'AI drafted ✦'}
                  </span>
                </div>

                {/* AI-drafted email — editable before sending */}
                <div className="mb-3">
                  {emailDrafts[group.email] !== undefined ? (
                    <textarea
                      rows={5}
                      value={emailDrafts[group.email]}
                      onChange={e => setEmailDrafts(prev => ({ ...prev, [group.email]: e.target.value }))}
                      className="w-full px-3.5 py-3 text-sm focus:outline-none resize-none"
                      style={{ background: 'var(--cream)', border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', color: 'var(--text)', fontSize: '0.8rem', lineHeight: 1.6 }}
                      placeholder="Email draft loading…"
                    />
                  ) : (
                    <div className="px-3.5 py-3" style={{ background: 'var(--cream)', border: '1px solid var(--cream-dark)', borderRadius: '4px', minHeight: '5rem' }}>
                      <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.78rem', fontStyle: 'italic' }}>Drafting email…</p>
                    </div>
                  )}
                </div>

                <p className="px-1 mb-1.5" style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Items</p>
                <div className="space-y-2">
                  {group.items.map(item => (
                    <div key={item.flagId} style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '0.875rem 1rem' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p style={{ fontFamily: 'var(--font-dm-sans)', color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500 }}>{item.itemName}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>flagged by {item.flaggedBy}</p>
                        </div>
                        <button onClick={() => removeDraftItem(item.flagId)} style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '1rem', lineHeight: 1, flexShrink: 0, paddingLeft: '0.5rem' }}>×</button>
                      </div>
                      <input
                        className="w-full px-3 py-2 text-sm focus:outline-none"
                        style={{ background: 'var(--cream)', border: '1px solid var(--cream-dark)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', color: 'var(--text)' }}
                        placeholder="Add a note for the supplier…"
                        value={item.note}
                        onChange={e => updateDraftNote(item.flagId, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {draftBySupplier.none.length > 0 && (
              <div>
                <p className="font-serif mb-2.5 px-1" style={{ fontSize: '0.7rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  No Supplier Configured
                </p>
                <div className="space-y-1.5">
                  {draftBySupplier.none.map(item => (
                    <div key={item.flagId} className="flex items-center justify-between px-4 py-3"
                      style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', opacity: 0.6 }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-dm-sans)', color: 'var(--text)', fontSize: '0.875rem' }}>{item.itemName}</p>
                        <p style={{ fontSize: '0.68rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>will be marked ordered · no email sent</p>
                      </div>
                      <button onClick={() => removeDraftItem(item.flagId)} style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '1rem' }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 px-4 pb-8 pt-4" style={{ background: 'linear-gradient(to top, var(--cream) 65%, transparent)' }}>
            {emailError && <p className="text-xs mb-2 text-center" style={{ color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)' }}>{emailError}</p>}
            <button onClick={confirmAndSend} disabled={confirmSending} className="w-full py-4 text-xs uppercase tracking-widest disabled:opacity-50"
              style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }}>
              {confirmSending ? 'Sending…' : draftBySupplier.groups.length > 0
                ? `Confirm & Send to ${draftBySupplier.groups.length} Supplier${draftBySupplier.groups.length > 1 ? 's' : ''} →`
                : 'Mark as Ordered →'}
            </button>
          </div>
        </div>
      )}

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

        {(pending.length > 0 || ordered.length > 0 || belowPar.length > 0 || eightySixes.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {pending.length > 0 && (
              <div className="flex items-baseline gap-1.5 px-3.5 py-2.5" style={{ background: 'rgba(107,39,55,0.07)', border: '1px solid rgba(107,39,55,0.15)', borderRadius: '4px' }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--wine)', lineHeight: 1 }}>{pending.length}</span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem', color: 'var(--wine)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>need reorder</span>
              </div>
            )}
            {ordered.length > 0 && (
              <div className="flex items-baseline gap-1.5 px-3.5 py-2.5" style={{ background: 'rgba(122,90,48,0.07)', border: '1px solid rgba(122,90,48,0.18)', borderRadius: '4px' }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.25rem', fontWeight: 600, color: '#7A5A30', lineHeight: 1 }}>{ordered.length}</span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem', color: '#7A5A30', textTransform: 'uppercase', letterSpacing: '0.15em' }}>awaiting delivery</span>
              </div>
            )}
            {belowPar.length > 0 && (
              <div className="flex items-baseline gap-1.5 px-3.5 py-2.5" style={{ background: 'rgba(196,168,130,0.12)', border: '1px solid rgba(196,168,130,0.3)', borderRadius: '4px' }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.25rem', fontWeight: 600, color: '#8A6A30', lineHeight: 1 }}>{belowPar.length}</span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem', color: '#8A6A30', textTransform: 'uppercase', letterSpacing: '0.15em' }}>below par</span>
              </div>
            )}
            {eightySixes.length > 0 && (
              <div className="flex items-baseline gap-1.5 px-3.5 py-2.5" style={{ background: 'rgba(193,113,79,0.08)', border: '1px solid rgba(193,113,79,0.2)', borderRadius: '4px' }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--terra)', lineHeight: 1 }}>{eightySixes.length}</span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem', color: 'var(--terra)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>out of stock</span>
              </div>
            )}
          </div>
        )}

        {belowPar.length > 0 && (
          <div>
            <p className="font-serif mb-3 px-1" style={{ fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--wine)' }}>Below Par · {belowPar.length}</p>
            <div className="space-y-2">
              {belowPar.map(item => (
                <div key={item.id} style={{ background: 'white', borderRadius: '4px', border: '1px solid var(--cream-dark)', borderLeft: '3px solid var(--gold)' }}>
                  <div className="px-4 py-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>{item.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{item.category_name} · counted by {item.counted_by} · {getTimeAgo(item.counted_at)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium" style={{ color: '#7A5A30', fontFamily: 'var(--font-dm-sans)' }}>{item.current_qty} / {item.par_level} {item.par_unit}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>need {item.par_level - item.current_qty} more</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {eightySixes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="font-serif" style={{ fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--terra)' }}>Out of Stock · {eightySixes.length}</p>
              <button onClick={clearAllEightySixes} className="text-xs underline" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Clear all</button>
            </div>
            <div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>
              {eightySixes.map((e, i) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? '1px solid var(--cream-dark)' : undefined }}>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: 'var(--font-dm-sans)', color: 'var(--text)', fontSize: '0.875rem' }}>{e.item_name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>marked out by {e.marked_by} · {getTimeAgo(e.marked_at)}{e.note ? ` · "${e.note}"` : ''}</p>
                  </div>
                  <button onClick={() => clearEightySix(e.id)} className="py-1.5 px-3 text-xs uppercase tracking-widest flex-shrink-0"
                    style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.2em' }}>Clear</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {flags.length === 0 && belowPar.length === 0 ? (
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
                  <button onClick={markAllOrdered} className="text-xs underline" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Review all →</button>
                </div>
                <div className="space-y-2">
                  {pending.map(flag => <FlagCard key={flag.id} flag={flag} emailSent={emailsSent.has(flag.id)} onOrdered={() => updateStatus(flag.id, 'ordered')} onReceived={() => updateStatus(flag.id, 'received')} />)}
                </div>
              </div>
            )}
            {ordered.length > 0 && (
              <div>
                <p className="font-serif mb-3 px-1" style={{ fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#7A5A30' }}>Ordered · Awaiting Delivery · {ordered.length}</p>
                <div className="space-y-2">
                  {ordered.map(flag => <FlagCard key={flag.id} flag={flag} emailSent={emailsSent.has(flag.id)} onOrdered={() => updateStatus(flag.id, 'ordered')} onReceived={() => updateStatus(flag.id, 'received')} />)}
                </div>
              </div>
            )}
          </>
        )}

        {recentOrders.length > 0 && (
          <div>
            <p className="font-serif mb-3 px-1" style={{ fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)' }}>Order History</p>
            <div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>
              {recentOrders.map((order, i) => (
                <div key={order.id} className="px-4 py-3 flex items-start justify-between gap-3"
                  style={{ borderTop: i > 0 ? '1px solid var(--cream-dark)' : undefined }}>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'var(--text)' }}>{order.supplier_name}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.items.map(i => i.name).join(', ')}
                    </p>
                  </div>
                  <p style={{ fontSize: '0.68rem', color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', flexShrink: 0 }}>{getDateShort(order.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

function FlagCard({ flag, emailSent, onOrdered, onReceived }: { flag: FlagWithSupplier; emailSent: boolean; onOrdered: () => void; onReceived: () => void }) {
  const item = flag.item as FlagWithSupplier['item']
  const isOrdered = flag.status === 'ordered'
  const hasSupplier = !!item?.category?.supplier_email
  return (
    <div style={{ background: 'white', borderRadius: '4px', overflow: 'hidden', opacity: isOrdered ? 0.78 : 1, border: '1px solid var(--cream-dark)', borderLeft: `3px solid ${isOrdered ? 'var(--gold)' : 'var(--wine)'}` }}>
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>{item?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{item?.category?.name} · {flag.flagged_by} · {getTimeAgo(flag.flagged_at)}</p>
            {flag.note && <p className="text-sm mt-1.5 italic px-2.5 py-1.5" style={{ background: 'var(--cream)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)' }}>&quot;{flag.note}&quot;</p>}
            {emailSent && hasSupplier && <p className="text-xs mt-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>✉ Order sent to {item.category.supplier_name || item.category.supplier_email}</p>}
          </div>
          <span className="text-xs px-2.5 py-1 flex-shrink-0 uppercase tracking-widest"
            style={isOrdered ? { background: 'rgba(196,168,130,0.15)', color: '#7A5A30', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.2em' } : { background: 'rgba(107,39,55,0.08)', color: 'var(--wine)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.2em' }}>
            {isOrdered ? 'Ordered' : 'Low'}
          </span>
        </div>
        <div className="flex gap-2 mt-3">
          {!isOrdered && (
            <button onClick={onOrdered} className="flex-1 py-2.5 text-xs uppercase tracking-widest"
              style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
              {hasSupplier ? 'Review & Order ✉' : 'Mark Ordered'}
            </button>
          )}
          <button onClick={onReceived} className={`py-2.5 text-xs uppercase tracking-widest ${isOrdered ? 'flex-1' : 'px-4'}`}
            style={{ border: '1px solid rgba(0,0,0,0.1)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
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

function getDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
