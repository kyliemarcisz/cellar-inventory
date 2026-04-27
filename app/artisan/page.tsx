'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AIPersona } from '@/lib/supabase'
import Link from 'next/link'

type Message = { role: 'user' | 'assistant'; content: string }

const SHOP_ID = '00000000-0000-0000-0000-000000000001'

export default function ArtisanPage() {
  const [personas, setPersonas] = useState<AIPersona[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadPersonas()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadPersonas() {
    const { data } = await supabase
      .from('ai_personas')
      .select('*')
      .eq('shop_id', SHOP_ID)
      .eq('is_active', true)
      .order('sort_order')

    if (data && data.length > 0) {
      setPersonas(data as AIPersona[])
      setActiveId(data[0].id)
    }
    setLoading(false)
  }

  function switchPersona(id: string) {
    if (id === activeId) return
    setActiveId(id)
    setMessages([])
    setInput('')
  }

  const persona = personas.find(p => p.id === activeId)

  async function send(text: string) {
    if (!text.trim() || streaming || !persona) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setStreaming(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          systemPrompt: persona.system_prompt,
        }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: d } = await reader.read()
        done = d
        if (value) {
          const chunk = decoder.decode(value)
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + chunk,
            }
            return updated
          })
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'Sorry, something went wrong. Please try again.',
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '1.1rem' }}>a moment...</p>
      </main>
    )
  }

  if (personas.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--cream)' }}>
        <p className="font-serif mb-2" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)' }}>No personas set up yet.</p>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Add one in Admin to get started.</p>
        <Link href="/admin" className="text-xs underline tracking-widest uppercase" style={{ color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>
          Go to Admin
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div
        className="sticky top-0 backdrop-blur border-b px-4 py-3 z-10"
        style={{ background: 'rgba(245,239,224,0.96)', borderColor: 'var(--cream-dark)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)', letterSpacing: '0.01em' }}>
              Grace
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.04em' }}>
              {persona ? `Ask ${persona.name} anything` : 'Select a persona'}
            </p>
          </div>
          <Link href="/" className="text-xs tracking-widest uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>
            ← Home
          </Link>
        </div>

        {/* Persona tabs */}
        <div className="flex gap-1.5 p-1" style={{ background: 'var(--cream-dark)', borderRadius: '4px' }}>
          {personas.map(p => (
            <button
              key={p.id}
              onClick={() => switchPersona(p.id)}
              className="flex-1 py-2.5 text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
              style={activeId === p.id
                ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }
                : { color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }}
            >
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36 space-y-4">
        {messages.length === 0 && persona && (
          <div className="pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{persona.emoji}</div>
              <p className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--text)', letterSpacing: '0.01em' }}>
                {persona.name}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                {persona.title}
              </p>
            </div>
            {persona.quick_prompts.length > 0 && (
              <div className="space-y-1.5">
                {persona.quick_prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => send(prompt)}
                    className="w-full text-left px-4 py-3 text-sm transition-colors"
                    style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && persona && (
              <span className="text-xl mr-2 mt-1 flex-shrink-0">{persona.emoji}</span>
            )}
            <div
              className="max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={msg.role === 'user'
                ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '12px 12px 3px 12px', fontFamily: 'var(--font-dm-sans)' }
                : { background: 'white', color: 'var(--text)', border: '1px solid var(--cream-dark)', borderRadius: '3px 12px 12px 12px', fontFamily: 'var(--font-dm-sans)' }}
            >
              {msg.content}
              {streaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                <span className="inline-block w-2 h-4 bg-current opacity-40 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4"
        style={{ background: 'linear-gradient(to top, var(--cream) 65%, transparent)' }}
      >
        <div className="flex gap-2">
          <input
            className="flex-1 px-4 py-3 text-sm focus:outline-none"
            style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
            placeholder={persona ? `Ask ${persona.name}...` : 'Ask...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
            disabled={streaming}
          />
          <button
            onClick={() => send(input)}
            disabled={streaming || !input.trim()}
            className="px-5 font-semibold disabled:opacity-40 transition-colors"
            style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
          >
            {streaming ? '···' : '↑'}
          </button>
        </div>
      </div>
    </main>
  )
}
