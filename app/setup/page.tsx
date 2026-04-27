'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const TEMPLATES: Record<string, string[]> = {
  'wine bar':    ['Red Wine', 'White Wine', 'Rosé & Sparkling', 'Spirits', 'Beer & Cider', 'Non-Alcoholic', 'Garnishes & Bar', 'Glassware'],
  'coffee shop': ['Espresso & Coffee', 'Cold Brew & Tea', 'Syrups & Sauces', 'Dairy & Alt Milk', 'Pastries', 'Food Items', 'Packaging & Supplies'],
  'fine dining': ['Fish & Seafood', 'Meat & Poultry', 'Produce', 'Dairy', 'Dry Goods', 'Wine', 'Spirits', 'Pastry & Dessert'],
  'fast casual': ['Proteins', 'Produce', 'Dairy', 'Dry Goods', 'Sauces & Condiments', 'Beverages', 'Packaging'],
  'bar':         ['Spirits', 'Beer & Cider', 'Wine', 'Mixers & Soda', 'Garnishes & Bar', 'Non-Alcoholic', 'Glassware'],
  'other':       ['Food', 'Beverages', 'Dry Goods', 'Supplies'],
}

const VENUE_TYPES = ['wine bar', 'coffee shop', 'fine dining', 'fast casual', 'bar', 'other']

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function SetupPage() {
  const [step, setStep] = useState(1)

  // Step 1 state
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [tagline, setTagline] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugError, setSlugError] = useState('')

  // Step 2 state
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [customList, setCustomList] = useState<string[]>([])

  // Step 3 state
  const [saving, setSaving] = useState(false)
  const [savedSlug, setSavedSlug] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  function handleSlugChange(v: string) {
    setSlugEdited(true)
    setSlug(toSlug(v))
    setSlugError('')
  }

  function handleTypeChange(v: string) {
    setType(v)
    setSelected(TEMPLATES[v] ?? [])
    setCustomList([])
  }

  function toggleCategory(cat: string) {
    setSelected(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  function addCustom() {
    const t = custom.trim()
    if (!t) return
    if (!customList.includes(t) && !selected.includes(t)) {
      setCustomList(prev => [...prev, t])
      setSelected(prev => [...prev, t])
    }
    setCustom('')
  }

  async function handleLaunch() {
    setSaving(true)
    setSlugError('')

    const { data: shopData, error: shopErr } = await supabase
      .from('shops')
      .insert({ name: name.trim(), slug, type, tagline: tagline.trim() || null })
      .select('id')
      .single()

    if (shopErr) {
      if (shopErr.message?.includes('unique') || shopErr.code === '23505') {
        setSlugError('That URL is already taken — try a different one.')
        setSaving(false)
        setStep(1)
      } else {
        setSlugError(shopErr.message)
        setSaving(false)
        setStep(1)
      }
      return
    }

    const shopId = shopData.id
    const allCats = [...selected]
    if (allCats.length > 0) {
      await supabase.from('categories').insert(
        allCats.map((cat, i) => ({ name: cat, shop_id: shopId, sort_order: i }))
      )
    }

    setSavedSlug(slug)
    setSaving(false)
    setStep(3)
  }

  function copyLink(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  const canProceed1 = name.trim().length > 1 && type && slug.length > 1
  const canProceed2 = selected.length > 0
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const roles = [
    { key: 'staff',   label: 'staff',    desc: 'Flag low items' },
    { key: 'kitchen', label: 'kitchen',  desc: 'Task queue display' },
    { key: 'owner',   label: 'owner',    desc: 'Reorder board' },
    { key: 'artisan', label: 'ask grace', desc: 'AI sommelier / guide' },
    { key: 'admin',   label: 'admin',    desc: 'Manage items & personas' },
  ]

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12" style={{ background: 'var(--cream)' }}>
      {/* Wordmark */}
      <Link href="/" className="font-serif mb-10 block" style={{ fontSize: '1rem', letterSpacing: '0.55em', paddingLeft: '0.55em', color: 'var(--text)' }}>
        corner
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className="w-6 h-6 flex items-center justify-center text-xs" style={{
              borderRadius: '50%',
              background: step >= n ? 'var(--wine)' : 'transparent',
              border: `1px solid ${step >= n ? 'var(--wine)' : 'var(--cream-dark)'}`,
              color: step >= n ? 'var(--cream)' : 'var(--muted)',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '0.62rem',
            }}>{n}</div>
            {n < 3 && <div style={{ width: '1.5rem', height: '1px', background: step > n ? 'var(--wine)' : 'var(--cream-dark)' }} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Shop Info ── */}
      {step === 1 && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 className="font-serif text-center mb-1" style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--text)' }}>
            Your restaurant
          </h1>
          <p className="text-center mb-7 text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            Let&apos;s set up your Corner.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.62rem', letterSpacing: '0.2em' }}>Name</label>
              <input
                className="w-full px-4 py-3 text-sm focus:outline-none"
                style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                placeholder="The Cellar"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.62rem', letterSpacing: '0.2em' }}>Venue type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {VENUE_TYPES.map(t => (
                  <button key={t} onClick={() => handleTypeChange(t)} className="py-2 text-xs capitalize" style={{
                    borderRadius: '3px',
                    border: `1px solid ${type === t ? 'var(--wine)' : 'var(--cream-dark)'}`,
                    background: type === t ? 'var(--wine)' : 'white',
                    color: type === t ? 'var(--cream)' : 'var(--text)',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.05em',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.62rem', letterSpacing: '0.2em' }}>Tagline <span style={{ opacity: 0.5 }}>(optional)</span></label>
              <input
                className="w-full px-4 py-3 text-sm focus:outline-none"
                style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                placeholder="A corner of Tuscany in the city"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.62rem', letterSpacing: '0.2em' }}>Your URL</label>
              <div className="flex items-center" style={{ background: 'white', border: `1px solid ${slugError ? 'var(--wine)' : 'var(--cream-dark)'}`, borderRadius: '4px', overflow: 'hidden' }}>
                <span className="px-3 py-3 text-xs select-none" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', borderRight: '1px solid var(--cream-dark)', whiteSpace: 'nowrap' }}>corner.app/</span>
                <input
                  className="flex-1 px-3 py-3 text-sm focus:outline-none"
                  style={{ background: 'transparent', color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}
                  value={slug}
                  onChange={e => handleSlugChange(e.target.value)}
                  placeholder="the-cellar"
                />
              </div>
              {slugError && <p className="text-xs mt-1" style={{ color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)' }}>{slugError}</p>}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canProceed1}
            className="w-full mt-7 py-3.5 text-xs uppercase tracking-widest disabled:opacity-40"
            style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}
          >
            Continue →
          </button>
        </div>
      )}

      {/* ── Step 2: Categories ── */}
      {step === 2 && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 className="font-serif text-center mb-1" style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--text)' }}>
            Your inventory
          </h1>
          <p className="text-center mb-7 text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            Choose the categories your team will track.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {(TEMPLATES[type] ?? []).concat(customList.filter(c => !(TEMPLATES[type] ?? []).includes(c))).map(cat => (
              <button key={cat} onClick={() => toggleCategory(cat)} className="px-3 py-2 text-xs" style={{
                borderRadius: '3px',
                border: `1px solid ${selected.includes(cat) ? 'var(--wine)' : 'var(--cream-dark)'}`,
                background: selected.includes(cat) ? 'var(--wine)' : 'white',
                color: selected.includes(cat) ? 'var(--cream)' : 'var(--text)',
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '0.72rem',
              }}>
                {selected.includes(cat) ? '✓ ' : ''}{cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
              placeholder="Add a custom category…"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
            />
            <button onClick={addCustom} className="px-4 text-xs" style={{ background: 'var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>
              Add
            </button>
          </div>

          <p className="text-xs mt-3 mb-6" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            {selected.length} {selected.length === 1 ? 'category' : 'categories'} selected
          </p>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-5 py-3.5 text-xs uppercase tracking-widest" style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.65rem' }}>
              Back
            </button>
            <button onClick={handleLaunch} disabled={!canProceed2 || saving} className="flex-1 py-3.5 text-xs uppercase tracking-widest disabled:opacity-40" style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
              {saving ? 'Launching…' : 'Launch →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Go Live ── */}
      {step === 3 && (
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ border: '1px solid var(--wine)', color: 'var(--wine)', borderRadius: '50%', fontSize: '1.2rem' }}>✓</div>
            <h1 className="font-serif mb-1" style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text)' }}>{name} is live.</h1>
            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Share these links with your team.</p>
          </div>

          <div className="space-y-2 mb-7">
            {roles.map(r => {
              const url = `${base}/${savedSlug}/${r.key}`
              const isCopied = copied === r.key
              return (
                <div key={r.key} className="flex items-center gap-3 px-4 py-3" style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', letterSpacing: '0.2em' }}>{r.label}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>/{savedSlug}/{r.key}</p>
                  </div>
                  <button onClick={() => copyLink(url, r.key)} className="text-xs px-3 py-1.5 flex-shrink-0 uppercase tracking-widest" style={{
                    background: isCopied ? 'var(--wine)' : 'var(--cream-dark)',
                    color: isCopied ? 'var(--cream)' : 'var(--text)',
                    borderRadius: '3px',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: '0.58rem',
                    letterSpacing: '0.15em',
                    transition: 'all 0.15s',
                  }}>
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )
            })}
          </div>

          <Link href={`/${savedSlug}`} className="block w-full py-3.5 text-center text-xs uppercase tracking-widest" style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
            Enter your Corner →
          </Link>

          <p className="text-center mt-4 text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            Add items and personas in <Link href={`/${savedSlug}/admin`} className="underline" style={{ color: 'var(--wine)' }}>admin</Link>.
          </p>
        </div>
      )}
    </main>
  )
}
