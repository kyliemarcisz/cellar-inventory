'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import type { AIPersona, ShopDocument } from '@/lib/supabase'
import Link from 'next/link'

type Message = { role: 'user' | 'assistant'; content: string }

const DEFAULT_PERSONA: AIPersona = {
  id: '__grace__',
  shop_id: '',
  name: 'Grace',
  title: 'Your restaurant AI',
  emoji: '✦',
  theme: 'dark',
  system_prompt: "You are Grace, Corner's AI assistant for this restaurant. Be concise and practical — staff are busy. Answer in 1–3 sentences unless detail is genuinely needed. Speak with warmth and directness, like a senior colleague who knows the kitchen cold. If nothing is flagged, say so confidently. Don't pad responses.",
  quick_prompts: ["What's running low?", "What's 86'd right now?", "What needs to be ordered?", "What's in the kitchen queue?"],
  sort_order: 0,
  is_active: true,
}

export default function ArtisanPage() {
  const { shopId, shop, loading: shopLoading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()
  const [personas, setPersonas] = useState<AIPersona[]>([])
  const [activeId, setActiveId] = useState<string>(DEFAULT_PERSONA.id)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [inventoryContext, setInventoryContext] = useState('')
  const [contextLoaded, setContextLoaded] = useState(false)
  const [documents, setDocuments] = useState<ShopDocument[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shopLoading && shopId) {
      loadPersonas()
      loadDocuments()
      loadInventoryContext()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopLoading, shopId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadPersonas() {
    if (!shopId) return
    const { data } = await supabase.from('ai_personas').select('*').eq('shop_id', shopId).eq('is_active', true).order('sort_order')
    if (data && data.length > 0) {
      setPersonas(data as AIPersona[])
      setActiveId(data[0].id)
    }
    setLoading(false)
  }

  async function loadDocuments() {
    if (!shopId) return
    const { data } = await supabase.from('shop_documents').select('*').eq('shop_id', shopId).order('created_at')
    if (data) setDocuments(data as ShopDocument[])
  }

  async function loadInventoryContext() {
    if (!shopId) return

    const { data: cats } = await supabase.from('categories').select('id, name, supplier_name, supplier_email').eq('shop_id', shopId)
    const catIds = cats?.map((c: { id: string }) => c.id) || []
    const { data: its } = catIds.length
      ? await supabase.from('items').select('id, name, par_level, par_unit').in('category_id', catIds).eq('is_active', true)
      : { data: [] as { id: string; name: string; par_level: number | null; par_unit: string | null }[] }
    const itemIds = (its || []).map(i => i.id)

    const lines: string[] = ['LIVE RESTAURANT DATA:\n']

    if (itemIds.length) {
      const { data: flags } = await supabase.from('flags')
        .select('*, item:items(name, category:categories(name))')
        .in('item_id', itemIds).in('status', ['pending', 'ordered'])
      const pending = (flags || []).filter((f: { status: string }) => f.status === 'pending')
      const ordered = (flags || []).filter((f: { status: string }) => f.status === 'ordered')
      if (pending.length) {
        lines.push('FLAGGED LOW (needs reorder):')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pending.forEach((f: any) => lines.push(`- ${f.item?.name} (${f.item?.category?.name}) — by ${f.flagged_by}${f.note ? `, "${f.note}"` : ''}`))
      } else {
        lines.push('FLAGGED LOW: none')
      }
      if (ordered.length) {
        lines.push('\nORDERED (awaiting delivery):')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ordered.forEach((f: any) => lines.push(`- ${f.item?.name}`))
      }
    } else {
      lines.push('FLAGGED LOW: none')
    }

    const { data: eighties } = await supabase.from('eighty_sixes').select('*').eq('shop_id', shopId).eq('is_active', true)
    if (eighties?.length) {
      lines.push("\n86'D (unavailable right now):")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eighties.forEach((e: any) => lines.push(`- ${e.item_name}${e.note ? ` ("${e.note}")` : ''} — by ${e.marked_by}`))
    } else {
      lines.push("\n86'D: nothing currently")
    }

    if (itemIds.length) {
      const { data: tasks } = await supabase.from('tasks')
        .select('*, item:items(name)')
        .in('item_id', itemIds).in('status', ['pending', 'in_progress'])
        .order('urgency', { ascending: false })
      if (tasks?.length) {
        lines.push('\nKITCHEN QUEUE:')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tasks.forEach((t: any) => lines.push(`- ${t.item?.name} [${t.urgency}${t.status === 'in_progress' ? ', in progress' : ''}]${t.note ? ` — "${t.note}"` : ''}`))
      } else {
        lines.push('\nKITCHEN QUEUE: all clear')
      }
    }

    const itemsWithPar = (its || []).filter(i => i.par_level != null)
    if (itemsWithPar.length) {
      const { data: counts } = await supabase.from('inventory_counts')
        .select('item_id, quantity').in('item_id', itemsWithPar.map(i => i.id)).order('counted_at', { ascending: false })
      const latest: Record<string, number> = {}
      for (const c of (counts || [])) { if (!(c.item_id in latest)) latest[c.item_id] = c.quantity }
      const belowPar = itemsWithPar.filter(i => i.id in latest && latest[i.id] < (i.par_level as number))
      if (belowPar.length) {
        lines.push('\nBELOW PAR:')
        belowPar.forEach(i => lines.push(`- ${i.name}: ${latest[i.id]} / ${i.par_level} ${i.par_unit || 'units'}`))
      }
    }

    // Supplier contacts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const suppliersWithContact = (cats || []).filter((c: any) => c.supplier_name)
    if (suppliersWithContact.length) {
      lines.push('\nSUPPLIER CONTACTS:')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suppliersWithContact.forEach((c: any) => {
        const contact = c.supplier_email ? `${c.supplier_name} (${c.supplier_email})` : c.supplier_name
        lines.push(`- ${c.name}: ${contact}`)
      })
    }

    // Historical patterns: most flagged items in last 30 days
    if (itemIds.length) {
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data: histFlags } = await supabase.from('flags').select('item_id').in('item_id', itemIds).gte('flagged_at', since30)
      if (histFlags && histFlags.length > 0) {
        const countMap: Record<string, number> = {}
        for (const f of histFlags) countMap[f.item_id] = (countMap[f.item_id] || 0) + 1
        const topItems = (its || []).filter(i => (countMap[i.id] || 0) >= 2)
          .sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0)).slice(0, 5)
        if (topItems.length) {
          lines.push('\nFREQUENTLY LOW (last 30 days):')
          topItems.forEach(i => lines.push(`- ${i.name}: flagged ${countMap[i.id]}×`))
        }
      }
    }

    setInventoryContext(lines.join('\n'))
    setContextLoaded(true)
  }

  function switchPersona(id: string) {
    if (id === activeId) return
    setActiveId(id)
    setMessages([])
    setInput('')
  }

  const allPersonas = personas.length > 0 ? personas : [DEFAULT_PERSONA]
  const persona = allPersonas.find(p => p.id === activeId) || allPersonas[0]

  const buildSystemPrompt = () => {
    const base = persona.system_prompt.replace('this restaurant', shop?.name || 'this restaurant')
    return inventoryContext
      ? `${base}\n\nYou have access to the following live restaurant data. Use it to answer accurately:\n\n${inventoryContext}`
      : base
  }

  async function send(text: string) {
    if (!text.trim() || streaming || !persona) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          systemPrompt: buildSystemPrompt(),
          documents: documents.length ? documents.map(d => ({ name: d.name, content: d.content })) : undefined,
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
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: full } : m))
      }
    } catch {
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: 'Something went wrong. Try again.' } : m))
    }
    setStreaming(false)
  }

  if (notFound || shopLoading || loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--wine-dark)' }}>
      <p className="font-serif" style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{notFound ? 'Shop not found.' : 'a moment...'}</p>
    </main>
  )

  return (
    <main className="flex flex-col" style={{ background: 'var(--wine-dark)', height: '100dvh' }}>

      {/* Header */}
      <div className="flex-shrink-0 border-b px-4 py-3 z-10" style={{ background: 'rgba(30,20,16,0.97)', borderColor: 'rgba(196,168,130,0.12)' }}>
        <div className="flex items-center justify-between mb-2.5">
          <h1 className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 300, color: 'var(--cream)' }}>
            {persona.name} <span style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>{persona.emoji}</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest" style={{ color: contextLoaded ? 'var(--gold)' : 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.55rem', letterSpacing: '0.2em' }}>
              {contextLoaded ? 'live' : '…'}
            </span>
            <Link href={`/${slug}`} className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>← Home</Link>
          </div>
        </div>
        {allPersonas.length > 1 && (
          <div className="flex gap-1.5 p-1" style={{ background: 'rgba(196,168,130,0.07)', borderRadius: '4px' }}>
            {allPersonas.map(p => (
              <button key={p.id} onClick={() => switchPersona(p.id)}
                className="flex-1 py-2 text-xs uppercase tracking-widest flex items-center justify-center gap-1.5"
                style={activeId === p.id
                  ? { background: 'rgba(196,168,130,0.18)', color: 'var(--gold)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.6rem' }
                  : { color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.6rem' }}>
                {p.emoji} {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center pt-8">
            <div className="w-12 h-12 flex items-center justify-center mx-auto mb-5 font-serif"
              style={{ border: '1px solid rgba(196,168,130,0.35)', color: 'var(--gold)', borderRadius: '50%', fontSize: '1rem' }}>
              {persona.emoji}
            </div>
            <p className="font-serif" style={{ color: 'var(--cream)', fontSize: '1.5rem', fontWeight: 300 }}>Ask me anything.</p>
            <p className="text-sm mt-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{persona.title}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-2.5`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ border: '1px solid rgba(196,168,130,0.3)', color: 'var(--gold)', borderRadius: '50%', fontSize: '0.65rem' }}>
                {persona.emoji}
              </div>
            )}
            <div style={msg.role === 'user'
              ? { maxWidth: '78%', padding: '0.65rem 1rem', background: 'rgba(196,168,130,0.1)', border: '1px solid rgba(196,168,130,0.18)', borderRadius: '12px 12px 2px 12px', fontFamily: 'var(--font-dm-sans)', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5 }
              : { maxWidth: '85%' }
            }>
              {msg.role === 'assistant'
                ? <p className="font-serif" style={{ fontSize: '1rem', fontWeight: 300, lineHeight: 1.7, color: msg.content ? 'var(--cream)' : 'var(--muted)', whiteSpace: 'pre-wrap' }}>
                    {msg.content || (streaming ? '…' : '')}
                  </p>
                : msg.content
              }
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — empty state only */}
      {messages.length === 0 && contextLoaded && (
        <div className="flex-shrink-0 px-4 pb-3 flex flex-wrap gap-2">
          {persona.quick_prompts.map((p, i) => (
            <button key={i} onClick={() => send(p)}
              className="px-3.5 py-2 text-xs uppercase tracking-widest"
              style={{ border: '1px solid rgba(196,168,130,0.2)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.18em', background: 'transparent' }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 border-t px-4 py-3 flex gap-2 items-end"
        style={{ borderColor: 'rgba(196,168,130,0.12)', background: 'rgba(22,14,10,0.98)' }}>
        <textarea
          rows={1}
          className="flex-1 resize-none focus:outline-none px-3.5 py-2.5"
          style={{ background: 'rgba(196,168,130,0.06)', border: '1px solid rgba(196,168,130,0.15)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', color: 'var(--cream)', fontSize: '0.875rem', lineHeight: 1.5 }}
          placeholder={`Ask ${persona.name}…`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          disabled={streaming}
        />
        <button
          onClick={() => send(input)}
          disabled={streaming || !input.trim()}
          className="px-4 py-2.5 text-xs uppercase tracking-widest disabled:opacity-30 flex-shrink-0"
          style={{ background: 'var(--gold)', color: 'var(--wine-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
          {streaming ? '…' : 'Send'}
        </button>
      </div>

    </main>
  )
}
