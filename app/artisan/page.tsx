'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AIPersona } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

type Message = { role: 'user' | 'assistant'; content: string }

const THEME_TAB_ACTIVE: Record<string, string> = {
  stone:  'bg-stone-800 text-white',
  amber:  'bg-amber-500 text-white',
  green:  'bg-green-600 text-white',
  blue:   'bg-blue-600 text-white',
  rose:   'bg-rose-500 text-white',
  purple: 'bg-purple-600 text-white',
}

const THEME_BUBBLE: Record<string, string> = {
  stone:  'bg-stone-100 text-stone-800',
  amber:  'bg-amber-50 text-stone-800',
  green:  'bg-green-50 text-stone-800',
  blue:   'bg-blue-50 text-stone-800',
  rose:   'bg-rose-50 text-stone-800',
  purple: 'bg-purple-50 text-stone-800',
}

const THEME_SEND: Record<string, string> = {
  stone:  'bg-stone-800',
  amber:  'bg-amber-500',
  green:  'bg-green-600',
  blue:   'bg-blue-600',
  rose:   'bg-rose-500',
  purple: 'bg-purple-600',
}

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
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </main>
    )
  }

  if (personas.length === 0) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--cream)' }}>
        <p className="font-display italic text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No personas set up yet</p>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Add one in Admin to get started.</p>
        <Link href="/admin" className="underline text-sm" style={{ color: 'var(--wine)' }}>Go to Admin</Link>
      </main>
    )
  }

  const tabSend = THEME_SEND[persona?.theme || 'stone']

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Header */}
      <div className="sticky top-0 backdrop-blur border-b px-4 py-3 z-10"
        style={{ background: 'rgba(247,241,232,0.95)', borderColor: 'var(--cream-dark)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/cellar-logo.svg" alt="The Cellar" width={36} height={19}
                style={{ filter: 'brightness(0)', opacity: 0.7 }} />
              <h1 className="font-display italic text-lg font-bold" style={{ color: 'var(--text)' }}>Grace</h1>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {persona ? `Ask ${persona.name} anything` : 'Select a persona'}
            </p>
          </div>
          <Link href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Home</Link>
        </div>

        {/* Persona tabs */}
        <div className="flex rounded-2xl overflow-hidden p-1 gap-1" style={{ background: 'var(--cream-dark)' }}>
          {personas.map(p => (
            <button
              key={p.id}
              onClick={() => switchPersona(p.id)}
              className="font-label flex-1 py-2 text-base tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
              style={activeId === p.id
                ? { background: 'var(--wine)', color: 'var(--cream)' }
                : { color: 'var(--text)' }}
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
              <p className="font-display italic text-xl font-bold" style={{ color: 'var(--text)' }}>
                Hey, I&apos;m {persona.name}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{persona.title}</p>
            </div>
            {persona.quick_prompts.length > 0 && (
              <div className="space-y-2">
                {persona.quick_prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => send(prompt)}
                    className="w-full text-left px-4 py-3 rounded-2xl text-sm transition-colors"
                    style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)' }}
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
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
              style={msg.role === 'user'
                ? { background: 'var(--wine)', color: 'var(--cream)', borderBottomRightRadius: '6px' }
                : { background: 'white', color: 'var(--text)', border: '1px solid var(--cream-dark)', borderBottomLeftRadius: '6px' }}
            >
              {msg.content}
              {streaming && i === messages.length - 1 && msg.role === 'assistant' && msg.content === '' && (
                <span className="inline-block w-2 h-4 bg-current opacity-60 animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3"
        style={{ background: 'linear-gradient(to top, var(--cream) 70%, transparent)' }}>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl px-4 py-3 text-sm focus:outline-none"
            style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)' }}
            placeholder={persona ? `Ask ${persona.name}...` : 'Ask...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
            disabled={streaming}
          />
          <button
            onClick={() => send(input)}
            disabled={streaming || !input.trim()}
            className="px-5 rounded-2xl font-semibold disabled:opacity-40 transition-colors"
            style={{ background: 'var(--wine)', color: 'var(--cream)' }}
          >
            {streaming ? '···' : '↑'}
          </button>
        </div>
      </div>
    </main>
  )
}
