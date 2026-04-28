'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { THEMES, THEME_KEYS } from '@/lib/themes'
import Link from 'next/link'

const TEMPLATES: Record<string, string[]> = {
  'wine bar':    ['Red Wine', 'White Wine', 'Rosé & Sparkling', 'Spirits', 'Beer & Cider', 'Non-Alcoholic', 'Garnishes & Bar', 'Glassware'],
  'coffee shop': ['Espresso & Coffee', 'Cold Brew & Tea', 'Syrups & Sauces', 'Dairy & Alt Milk', 'Pastries', 'Food Items', 'Packaging & Supplies'],
  'fine dining': ['Fish & Seafood', 'Meat & Poultry', 'Produce', 'Dairy', 'Dry Goods', 'Wine', 'Spirits', 'Pastry & Dessert'],
  'fast casual': ['Proteins', 'Produce', 'Dairy', 'Dry Goods', 'Sauces & Condiments', 'Beverages', 'Packaging'],
  'bar':         ['Spirits', 'Beer & Cider', 'Wine', 'Mixers & Soda', 'Garnishes & Bar', 'Non-Alcoholic', 'Glassware'],
  'other':       ['Food', 'Beverages', 'Dry Goods', 'Supplies'],
}

const VENUE_OPTIONS = [
  { key: 'wine bar',    emoji: '🍷', label: 'Wine Bar',    sub: 'Sommeliers & natural wine spots' },
  { key: 'coffee shop', emoji: '☕', label: 'Coffee Shop', sub: 'Cafés, roasteries, specialty coffee' },
  { key: 'fine dining', emoji: '🍽️', label: 'Restaurant',  sub: 'Full service, bistros, fine dining' },
  { key: 'fast casual', emoji: '🌮', label: 'Fast Casual', sub: 'QSR, food trucks, counter service' },
  { key: 'bar',         emoji: '🍺', label: 'Bar',         sub: 'Cocktail bars, taprooms, nightlife' },
  { key: 'other',       emoji: '✨', label: 'Other',       sub: 'Bakeries, delis, pop-ups & more' },
]

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [type, setType] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [editingSlug, setEditingSlug] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [customList, setCustomList] = useState<string[]>([])
  const [theme, setTheme] = useState('cellar')
  const [saving, setSaving] = useState(false)
  const [savedSlug, setSavedSlug] = useState('')
  const [savedName, setSavedName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  function pickType(t: string) {
    setType(t)
    setSelected(TEMPLATES[t] ?? [])
    setCustomList([])
    setStep(2)
  }

  function handleNameChange(v: string) {
    setName(v)
    if (!slugEdited) setSlug(toSlug(v))
  }

  function toggleCategory(cat: string) {
    setSelected(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  function addCustom() {
    const t = custom.trim()
    if (!t || customList.includes(t) || selected.includes(t)) { setCustom(''); return }
    setCustomList(prev => [...prev, t])
    setSelected(prev => [...prev, t])
    setCustom('')
  }

  async function handleLaunch() {
    setSaving(true)
    setSlugError('')

    const { data: shopData, error: shopErr } = await supabase
      .from('shops')
      .insert({ name: name.trim(), slug, type, tagline: null, theme })
      .select('id')
      .single()

    if (shopErr) {
      const isDupe = shopErr.message?.includes('unique') || shopErr.code === '23505'
      setSlugError(isDupe ? 'That URL is already taken — try a different one.' : shopErr.message)
      setSaving(false)
      setStep(2)
      return
    }

    if (selected.length > 0) {
      await supabase.from('categories').insert(
        selected.map((cat, i) => ({ name: cat, shop_id: shopData.id, sort_order: i }))
      )
    }

    setSavedSlug(slug)
    setSavedName(name.trim())
    setSaving(false)
    setStep(4)
    setTimeout(() => router.push(`/${slug}/admin`), 1800)
  }

  function copyLink(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  const canProceed2 = name.trim().length > 1 && slug.length > 1 && selected.length > 0
  const base = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12" style={{ background: 'var(--cream)' }}>
      <Link href="/" className="font-serif mb-10 block" style={{ fontSize: '1rem', letterSpacing: '0.55em', paddingLeft: '0.55em', color: 'var(--text)' }}>
        corner
      </Link>

      {step <= 3 && (
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: step >= n ? 'var(--wine)' : 'var(--cream-dark)', transition: 'background 0.2s' }} />
              {n < 3 && <div style={{ width: '1.5rem', height: '1px', background: step > n ? 'var(--wine)' : 'var(--cream-dark)' }} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 1: What kind of place? ── */}
      {step === 1 && (
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <h1 className="font-serif text-center mb-1" style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--text)' }}>What kind of place?</h1>
          <p className="text-center mb-7 text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            We&apos;ll pre-load the right inventory categories for you.
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {VENUE_OPTIONS.map(v => (
              <button key={v.key} onClick={() => pickType(v.key)} className="text-left p-4 transition-all"
                style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '6px' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', lineHeight: 1 }}>{v.emoji}</div>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', marginBottom: '0.2rem' }}>{v.label}</p>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem', color: 'var(--muted)', lineHeight: 1.3 }}>{v.sub}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Name + Categories ── */}
      {step === 2 && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h1 className="font-serif text-center mb-1" style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--text)' }}>Your restaurant</h1>
          <p className="text-center mb-7 text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            Name it, then confirm your inventory categories.
          </p>

          <div className="space-y-5">
            <div>
              <input className="w-full px-4 py-3.5 text-base focus:outline-none"
                style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                placeholder="Restaurant name" value={name} onChange={e => handleNameChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && canProceed2 && setStep(3)}
                autoFocus />
              {slug && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  {editingSlug ? (
                    <input className="flex-1 px-2 py-1 text-xs focus:outline-none"
                      style={{ background: 'var(--cream-dark)', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)' }}
                      value={slug}
                      onChange={e => { setSlugEdited(true); setSlug(toSlug(e.target.value)); setSlugError('') }}
                      onBlur={() => setEditingSlug(false)} autoFocus />
                  ) : (
                    <>
                      <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                        Your link: <span style={{ color: 'var(--text)' }}>/{slug}/staff</span>
                      </p>
                      <button onClick={() => setEditingSlug(true)} className="text-xs underline" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>edit</button>
                    </>
                  )}
                </div>
              )}
              {slugError && <p className="text-xs mt-1" style={{ color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)' }}>{slugError}</p>}
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest mb-2.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>
                Inventory categories · tap to remove
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(TEMPLATES[type] ?? []).concat(customList.filter(c => !(TEMPLATES[type] ?? []).includes(c))).map(cat => (
                  <button key={cat} onClick={() => toggleCategory(cat)} className="px-3 py-1.5 text-xs transition-all" style={{
                    borderRadius: '3px',
                    border: `1px solid ${selected.includes(cat) ? 'var(--wine)' : 'var(--cream-dark)'}`,
                    background: selected.includes(cat) ? 'var(--wine)' : 'rgba(0,0,0,0.03)',
                    color: selected.includes(cat) ? 'var(--cream)' : 'var(--muted)',
                    fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem',
                  }}>
                    {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                  placeholder="Add a category…" value={custom}
                  onChange={e => setCustom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustom()} />
                <button onClick={addCustom} className="px-4 text-xs"
                  style={{ background: 'var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>Add</button>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-7">
            <button onClick={() => setStep(1)} className="px-5 py-3.5 text-xs uppercase tracking-widest"
              style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.65rem' }}>Back</button>
            <button onClick={() => setStep(3)} disabled={!canProceed2} className="flex-1 py-3.5 text-xs uppercase tracking-widest disabled:opacity-40"
              style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Theme ── */}
      {step === 3 && (
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <h1 className="font-serif text-center mb-1" style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--text)' }}>Your vibe</h1>
          <p className="text-center mb-7 text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            How should your team&apos;s interface look?
          </p>

          <div className="grid grid-cols-2 gap-3 mb-5">
            {THEME_KEYS.map(key => {
              const t = THEMES[key]
              const isActive = theme === key
              return (
                <button key={key} onClick={() => setTheme(key)} style={{
                  borderRadius: '6px',
                  border: `2px solid ${isActive ? t.preview.accent : 'transparent'}`,
                  padding: 0, overflow: 'hidden', outline: 'none',
                  boxShadow: isActive ? `0 0 0 1px ${t.preview.accent}` : '0 1px 4px rgba(0,0,0,0.08)',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ background: t.preview.bg, padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ width: '40%', height: '5px', background: t.preview.text, borderRadius: '2px', opacity: 0.8 }} />
                      <div style={{ width: '20%', height: '4px', background: t.preview.muted, borderRadius: '2px', opacity: 0.5 }} />
                    </div>
                    <div style={{ background: t.preview.card, borderRadius: '3px', padding: '5px 7px', marginBottom: '4px' }}>
                      <div style={{ width: '70%', height: '4px', background: t.preview.text, borderRadius: '2px', opacity: 0.7, marginBottom: '3px' }} />
                      <div style={{ width: '45%', height: '3px', background: t.preview.muted, borderRadius: '2px', opacity: 0.4 }} />
                    </div>
                    <div style={{ background: t.preview.accent, borderRadius: '3px', padding: '4px 7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '40%', height: '3px', background: t.preview.bg, borderRadius: '2px', opacity: 0.85 }} />
                    </div>
                  </div>
                  <div style={{ background: t.preview.card, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', fontWeight: 500, color: t.preview.text }}>{t.name}</p>
                      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.56rem', color: t.preview.muted, marginTop: '1px' }}>{t.tagline}</p>
                    </div>
                    {isActive && (
                      <div style={{ width: '13px', height: '13px', borderRadius: '50%', background: t.preview.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: t.preview.bg, fontSize: '7px', lineHeight: 1 }}>✓</span>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-5 py-3.5 text-xs uppercase tracking-widest"
              style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.65rem' }}>Back</button>
            <button onClick={handleLaunch} disabled={saving} className="flex-1 py-3.5 text-xs uppercase tracking-widest disabled:opacity-40"
              style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
              {saving ? 'Launching…' : 'Launch →'}
            </button>
          </div>
          <button onClick={handleLaunch} disabled={saving} className="w-full mt-3 py-2 text-xs disabled:opacity-40"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            Skip, use default →
          </button>
        </div>
      )}

      {/* ── Step 4: Live ── */}
      {step === 4 && (
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4" style={{ border: '1px solid var(--wine)', color: 'var(--wine)', borderRadius: '50%', fontSize: '1.2rem' }}>✓</div>
            <h1 className="font-serif mb-1" style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text)' }}>{savedName} is live.</h1>
            <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Share these links with your team — no login needed.</p>
          </div>

          <p className="text-xs uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>Send to your team</p>
          <div className="space-y-1.5 mb-5">
            {[
              { key: 'staff',   label: 'Staff',   desc: 'Flag low stock · 86 board · count inventory' },
              { key: 'kitchen', label: 'Kitchen', desc: 'Task queue for the line' },
              { key: 'artisan', label: 'AI Guide', desc: 'Menu assistant & smart Q&A' },
            ].map(r => {
              const url = `${base}/${savedSlug}/${r.key}`
              const isCopied = copied === r.key
              return (
                <div key={r.key} className="flex items-center gap-3 px-4 py-3"
                  style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', letterSpacing: '0.2em' }}>{r.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{r.desc}</p>
                  </div>
                  <button onClick={() => copyLink(url, r.key)} className="text-xs px-3 py-1.5 flex-shrink-0 uppercase tracking-widest" style={{
                    background: isCopied ? 'var(--wine)' : 'var(--cream-dark)',
                    color: isCopied ? 'var(--cream)' : 'var(--text)',
                    borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.15em', transition: 'all 0.15s',
                  }}>
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )
            })}
          </div>

          <p className="text-xs uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em' }}>Keep for yourself</p>
          <div className="space-y-1.5 mb-6">
            {[
              { key: 'owner', label: 'Owner',  desc: 'Reorder board · below par · analytics' },
              { key: 'admin', label: 'Admin',  desc: 'Add your menu & manage everything', highlight: true },
            ].map(r => {
              const url = `${base}/${savedSlug}/${r.key}`
              const isCopied = copied === r.key
              return (
                <div key={r.key} className="flex items-center gap-3 px-4 py-3"
                  style={{ background: r.highlight ? 'rgba(107,39,55,0.04)' : 'white', border: `1px solid ${r.highlight ? 'rgba(107,39,55,0.2)' : 'var(--cream-dark)'}`, borderRadius: '4px' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-widest" style={{ color: r.highlight ? 'var(--wine)' : 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', letterSpacing: '0.2em' }}>{r.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{r.desc}</p>
                  </div>
                  <button onClick={() => copyLink(url, r.key)} className="text-xs px-3 py-1.5 flex-shrink-0 uppercase tracking-widest" style={{
                    background: isCopied ? 'var(--wine)' : 'var(--cream-dark)',
                    color: isCopied ? 'var(--cream)' : 'var(--text)',
                    borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.15em', transition: 'all 0.15s',
                  }}>
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )
            })}
          </div>

          <Link href={`/${savedSlug}/admin`} className="block w-full py-3.5 text-center text-xs uppercase tracking-widest"
            style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
            Add your menu in Admin →
          </Link>
          <Link href={`/${savedSlug}`} className="block w-full py-3 text-center text-xs mt-2"
            style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
            Explore your Corner →
          </Link>
        </div>
      )}
    </main>
  )
}
