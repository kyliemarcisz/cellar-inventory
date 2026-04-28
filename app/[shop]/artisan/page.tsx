'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import type { AIPersona, ShopDocument } from '@/lib/supabase'
import Link from 'next/link'

type Message = { role: 'user' | 'assistant'; content: string }

export default function ArtisanPage() {
  const { shopId, loading: shopLoading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()
  const [personas, setPersonas] = useState<AIPersona[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuContext, setMenuContext] = useState<string | null>(null)
  const [documents, setDocuments] = useState<ShopDocument[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shopLoading && shopId) { loadPersonas(); loadMenu(); loadDocuments() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopLoading, shopId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadPersonas() {
    if (!shopId) return
    const { data } = await supabase.from('ai_personas').select('*').eq('shop_id', shopId).eq('is_active', true).order('sort_order')
    if (data && data.length > 0) { setPersonas(data as AIPersona[]); setActiveId(data[0].id) }
    setLoading(false)
  }

  async function loadMenu() {
    if (!shopId) return
    const { data } = await supabase.from('shops').select('menu_text').eq('id', shopId).single()
    if (data?.menu_text) setMenuContext(data.menu_text)
  }

  async function loadDocuments() {
    if (!shopId) return
    const { data } = await supabase.from('shop_documents').select('*').eq('shop_id', shopId).order('created_at')
    if (data) setDocuments(data as ShopDocument[])
  }

  function switchPersona(id: string) {
    if (id === activeId) return
    setActiveId(id); setMessages([]); setInput('')
  }

  const persona = personas.find(p => p.id === activeId)

  async function send(text: string) {
    if (!text.trim() || streaming || !persona) return
    setMessages(prev => [...prev, { role: 'user', content: text.trim() }])
    setInput('')
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text.trim(), systemPrompt: persona.system_prompt, menuContext: menuContext || undefined, documents: documents.length ? documents.map(d => ({ name: d.name, content: d.content })) : undefined }) })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) {
          const chunk = decoder.decode(value)
          setMessages(prev => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], content: u[u.length - 1].content + chunk }; return u })
        }
      }
    } catch {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { ...u[u.length - 1], content: 'Sorry, something went wrong.' }; return u })
    } finally { setStreaming(false) }
  }

  if (notFound || shopLoading || loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
      <p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{notFound ? 'Shop not found.' : 'a moment...'}</p>
    </main>
  )

  if (personas.length === 0) return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--cream)' }}>
      <p className="font-serif mb-2" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)' }}>No personas set up yet.</p>
      <Link href={`/${slug}/admin`} className="text-xs underline uppercase tracking-widest" style={{ color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>Go to Admin</Link>
    </main>
  )

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      <div className="sticky top-0 backdrop-blur border-b px-4 py-3 z-10" style={{ background: 'rgba(245,239,224,0.96)', borderColor: 'var(--cream-dark)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)' }}>Grace</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{persona ? `Ask ${persona.name} anything` : 'Select a persona'}</p>
          </div>
          <Link href={`/${slug}`} className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>← Home</Link>
        </div>
        <div className="flex gap-1.5 p-1" style={{ background: 'var(--cream-dark)', borderRadius: '4px' }}>
          {personas.map(p => (
            <button key={p.id} onClick={() => switchPersona(p.id)} className="flex-1 py-2.5 text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
              style={activeId === p.id ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' } : { color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }}>
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36 space-y-4">
        {messages.length === 0 && persona && (
          <div className="pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{persona.emoji}</div>
              <p className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--text)' }}>{persona.name}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{persona.title}</p>
            </div>
            {persona.quick_prompts.length > 0 && (
              <div className="space-y-1.5">
                {persona.quick_prompts.map((prompt, i) => (
                  <button key={i} onClick={() => send(prompt)} className="w-full text-left px-4 py-3 text-sm" style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>{prompt}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && persona && <span className="text-xl mr-2 mt-1 flex-shrink-0">{persona.emoji}</span>}
            <div className="max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={msg.role === 'user'
                ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '12px 12px 3px 12px', fontFamily: 'var(--font-dm-sans)' }
                : { background: 'white', color: 'var(--text)', border: '1px solid var(--cream-dark)', borderRadius: '3px 12px 12px 12px', fontFamily: 'var(--font-dm-sans)' }}>
              {msg.content}
              {streaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && <span className="inline-block w-2 h-4 bg-current opacity-40 animate-pulse" />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4" style={{ background: 'linear-gradient(to top, var(--cream) 65%, transparent)' }}>
        <div className="flex gap-2">
          <input className="flex-1 px-4 py-3 text-sm focus:outline-none" style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }} placeholder={persona ? `Ask ${persona.name}...` : 'Ask...'} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))} disabled={streaming} />
          <button onClick={() => send(input)} disabled={streaming || !input.trim()} className="px-5 font-semibold disabled:opacity-40" style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px' }}>
            {streaming ? '···' : '↑'}
          </button>
        </div>
      </div>
    </main>
  )
}
