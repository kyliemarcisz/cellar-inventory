'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Change these two constants ───────────────────────────────────────────────
const FOUNDER_PASSWORD = 'corner-ops'
const FOUNDING_DATE = new Date('2025-03-01') // your actual founding date
// ─────────────────────────────────────────────────────────────────────────────

type Restaurant = { id: string; name: string; owner_name: string; phone: string; city: string; onboarded_at: string; status: 'trial' | 'active' | 'churned'; monthly_revenue: number; created_at: string }
type Health = { id: string; restaurant_id: string; last_order_at: string | null; last_engaged_at: string | null; open_complaints: string | null; satisfaction: 'happy' | 'neutral' | 'at_risk'; notes: string | null; updated_at: string }
type Activity = { id: string; date: string; category: string; note: string; created_at: string }
type Metrics = { id: string; total_restaurants: number; mrr: number; churn_count: number; trials_active: number; recorded_at: string }
type Runway = { id: string; bank_balance: number; monthly_expenses: number; mrr: number; recorded_at: string }
type Investor = { id: string; name: string; firm: string; check_size: string; stage: string; last_contacted_at: string | null; notes: string; created_at: string }
type Relationship = { id: string; name: string; company: string; type: string; last_contacted_at: string | null; notes: string; created_at: string }
type Milestone = { id: string; date: string; title: string; note: string | null; created_at: string }

const NAV = ['platform', 'restaurants', 'health', 'activity', 'metrics', 'runway', 'fundraising', 'relationships', 'milestones']
const STAGES = ['cold', 'emailed', 'met', 'interested', 'committed', 'passed']
const STAGE_COLORS: Record<string, string> = { cold: '#9A8878', emailed: '#C4A882', met: '#C1714F', interested: '#4A7C59', committed: '#6B2737', passed: '#C0C0C0' }
const SAT_COLORS: Record<string, string> = { happy: '#4A7C59', neutral: '#C4A882', at_risk: '#C1714F' }

const blank = (o: Record<string, string>) => Object.fromEntries(Object.keys(o).map(k => [k, '']))

export default function OpsPage() {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState(false)
  const [loading, setLoading] = useState(true)

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [health, setHealth] = useState<Health[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [metrics, setMetrics] = useState<Metrics[]>([])
  const [runway, setRunway] = useState<Runway[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [platformStats, setPlatformStats] = useState<{ shops: number; flagsWeek: number; tasksWeek: number }>({ shops: 0, flagsWeek: 0, tasksWeek: 0 })

  // form visibility
  const [showRest, setShowRest] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)
  const [showRunway, setShowRunway] = useState(false)
  const [showInvestor, setShowInvestor] = useState(false)
  const [showRelation, setShowRelation] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)

  // form drafts
  const [restDraft, setRestDraft] = useState({ name: '', owner_name: '', phone: '', city: '', onboarded_at: '', status: 'trial', monthly_revenue: '' })
  const [actDraft, setActDraft] = useState({ date: today(), category: 'sales', note: '' })
  const [metDraft, setMetDraft] = useState({ total_restaurants: '', mrr: '', churn_count: '', trials_active: '' })
  const [runDraft, setRunDraft] = useState({ bank_balance: '', monthly_expenses: '', mrr: '' })
  const [invDraft, setInvDraft] = useState({ name: '', firm: '', check_size: '', stage: 'cold', last_contacted_at: '', notes: '' })
  const [relDraft, setRelDraft] = useState({ name: '', company: '', type: 'partner', last_contacted_at: '', notes: '' })
  const [milDraft, setMilDraft] = useState({ date: today(), title: '', note: '' })

  // editing rows
  const [editingRest, setEditingRest] = useState<string | null>(null)
  const [editRestDraft, setEditRestDraft] = useState<Partial<Restaurant>>({})
  const [editingHealth, setEditingHealth] = useState<string | null>(null)
  const [editHealthDraft, setEditHealthDraft] = useState<Partial<Health>>({})
  const [editingInv, setEditingInv] = useState<string | null>(null)
  const [editInvDraft, setEditInvDraft] = useState<Partial<Investor>>({})
  const [editingRel, setEditingRel] = useState<string | null>(null)
  const [editRelDraft, setEditRelDraft] = useState<Partial<Relationship>>({})

  // filters
  const [actSearch, setActSearch] = useState('')
  const [actCat, setActCat] = useState('')
  const [invSort, setInvSort] = useState<'stage' | 'name'>('stage')

  useEffect(() => {
    const stored = localStorage.getItem('corner-ops-auth')
    if (stored === 'yes') setAuthed(true)
    else setLoading(false)
  }, [])

  useEffect(() => {
    if (!authed) return
    loadAll()
  }, [authed])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadRestaurants(), loadHealth(), loadActivity(), loadMetrics(), loadRunway(), loadInvestors(), loadRelationships(), loadMilestones(), loadPlatformStats()])
    setLoading(false)
  }

  async function loadPlatformStats() {
    const since = new Date(Date.now() - 7 * 86400000).toISOString()
    const [{ count: shops }, { count: flagsWeek }, { count: tasksWeek }] = await Promise.all([
      supabase.from('shops').select('id', { count: 'exact', head: true }),
      supabase.from('flags').select('id', { count: 'exact', head: true }).gte('flagged_at', since),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).gte('flagged_at', since),
    ])
    setPlatformStats({ shops: shops || 0, flagsWeek: flagsWeek || 0, tasksWeek: tasksWeek || 0 })
  }

  async function loadRestaurants() { const { data } = await supabase.from('biz_restaurants').select('*').order('created_at', { ascending: false }); if (data) setRestaurants(data as Restaurant[]) }
  async function loadHealth() { const { data } = await supabase.from('biz_health').select('*'); if (data) setHealth(data as Health[]) }
  async function loadActivity() { const { data } = await supabase.from('biz_activity').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }); if (data) setActivity(data as Activity[]) }
  async function loadMetrics() { const { data } = await supabase.from('biz_metrics').select('*').order('recorded_at', { ascending: false }); if (data) setMetrics(data as Metrics[]) }
  async function loadRunway() { const { data } = await supabase.from('biz_runway').select('*').order('recorded_at', { ascending: false }); if (data) setRunway(data as Runway[]) }
  async function loadInvestors() { const { data } = await supabase.from('biz_investors').select('*').order('created_at', { ascending: false }); if (data) setInvestors(data as Investor[]) }
  async function loadRelationships() { const { data } = await supabase.from('biz_relationships').select('*').order('created_at', { ascending: false }); if (data) setRelationships(data as Relationship[]) }
  async function loadMilestones() { const { data } = await supabase.from('biz_milestones').select('*').order('date', { ascending: false }); if (data) setMilestones(data as Milestone[]) }

  function login() {
    if (pw === FOUNDER_PASSWORD) { localStorage.setItem('corner-ops-auth', 'yes'); setAuthed(true); setPwErr(false) }
    else { setPwErr(true) }
  }

  // ── computed ────────────────────────────────────────────────────────────────
  const activeRests = restaurants.filter(r => r.status === 'active')
  const totalMRR = activeRests.reduce((s, r) => s + (r.monthly_revenue || 0), 0)
  const latestRunway = runway[0]
  const netBurn = latestRunway ? latestRunway.monthly_expenses - latestRunway.mrr : null
  const monthsRunway = latestRunway && netBurn && netBurn > 0 ? latestRunway.bank_balance / netBurn : null
  const daysSinceFounding = Math.floor((Date.now() - FOUNDING_DATE.getTime()) / 86400000)
  const runwayColor = monthsRunway == null ? 'var(--muted)' : monthsRunway < 3 ? '#C1714F' : monthsRunway < 6 ? '#C9A87C' : '#4A7C59'

  // ── password gate ───────────────────────────────────────────────────────────
  if (!authed) return (
    <main style={{ minHeight: '100vh', background: 'var(--wine-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>corner</p>
        <h1 className="font-serif" style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--cream)', marginBottom: '0.5rem' }}>Founder OS</h1>
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '2rem' }}>Private. Founder access only.</p>
        <input type="password" autoFocus value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Password" style={{ width: '100%', padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.06)', border: `1px solid ${pwErr ? 'var(--terra)' : 'rgba(196,168,130,0.25)'}`, color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
        {pwErr && <p style={{ color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Incorrect password.</p>}
        <button onClick={login} style={{ width: '100%', padding: '0.85rem', background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>Enter</button>
      </div>
    </main>
  )

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>loading…</p>
    </main>
  )

  const filteredActivity = activity.filter(a => {
    if (actCat && a.category !== actCat) return false
    if (actSearch && !a.note.toLowerCase().includes(actSearch.toLowerCase())) return false
    return true
  })

  const sortedInvestors = [...investors].sort((a, b) => {
    if (invSort === 'stage') return STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage)
    return a.name.localeCompare(b.name)
  })

  return (
    <main style={{ background: '#FAF8F4', minHeight: '100vh', paddingBottom: '6rem' }}>

      {/* ── Global Header ── */}
      <div style={{ background: 'var(--wine-dark)', padding: '1.5rem 1.5rem 1.25rem', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.55rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--gold)' }}>corner</span>
              <h1 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: 300, color: 'var(--cream)', marginTop: '0.1rem' }}>Founder OS</h1>
            </div>
            <button onClick={() => { localStorage.removeItem('corner-ops-auth'); setAuthed(false) }}
              style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', color: 'var(--muted)', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>
              sign out
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Restaurants', value: restaurants.filter(r => r.status !== 'churned').length.toString() },
              { label: 'MRR', value: `$${totalMRR.toLocaleString()}` },
              { label: 'Runway', value: monthsRunway == null ? (latestRunway ? '∞' : '—') : `${monthsRunway.toFixed(1)} mo`, color: runwayColor },
              { label: 'Days old', value: daysSinceFounding.toString() },
            ].map(m => (
              <div key={m.label}>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.55rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.15rem' }}>{m.label}</p>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.5rem', fontWeight: 600, color: m.color || 'var(--cream)', lineHeight: 1 }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <div style={{ background: 'var(--cream-dark)', borderBottom: '1px solid #D5C9B8', position: 'sticky', top: '116px', zIndex: 30, overflowX: 'auto' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '0', padding: '0 1.5rem' }}>
          {NAV.map(n => (
            <button key={n} onClick={() => document.getElementById(n)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--wine)', padding: '0.7rem 1rem', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem 0' }}>

        {/* ══ 0. PLATFORM ═════════════════════════════════════════════════════ */}
        <section id="platform" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Corner Platform" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Active Restaurants" value={platformStats.shops} accent />
            <StatCard label="Reorder Flags (7d)" value={platformStats.flagsWeek} />
            <StatCard label="Kitchen Tasks (7d)" value={platformStats.tasksWeek} />
            <StatCard label="Days Since Launch" value={daysSinceFounding} />
          </div>
          <div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1rem 1.25rem' }}>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem' }}>Quick Links</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[{ label: 'The Cellar — Staff', href: '/cellar/staff' }, { label: 'The Cellar — Owner', href: '/cellar/owner' }, { label: 'The Cellar — Grace', href: '/cellar/artisan' }, { label: 'Setup New Restaurant', href: '/setup' }].map(l => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem', color: 'var(--wine)', padding: '0.35rem 0.75rem', border: '1px solid rgba(107,39,55,0.2)', borderRadius: '3px', textDecoration: 'none' }}>{l.label} ↗</a>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 1. RESTAURANTS ══════════════════════════════════════════════════ */}
        <section id="restaurants" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Restaurants" action="Add restaurant" onAction={() => setShowRest(p => !p)} />
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <StatCard label="Total" value={restaurants.filter(r => r.status !== 'churned').length} />
            <StatCard label="Active" value={activeRests.length} />
            <StatCard label="Monthly Revenue" value={`$${totalMRR.toLocaleString()}`} accent />
          </div>

          {showRest && (
            <div style={formCard}>
              <div style={formGrid}>
                {[['name', 'Restaurant name *'], ['owner_name', 'Owner name'], ['phone', 'Phone'], ['city', 'City'], ['onboarded_at', 'Date onboarded']].map(([k, label]) => (
                  <div key={k}>
                    <label style={labelStyle}>{label}</label>
                    <input type={k === 'onboarded_at' ? 'date' : 'text'} value={(restDraft as any)[k]} onChange={e => setRestDraft(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} placeholder={label} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={restDraft.status} onChange={e => setRestDraft(p => ({ ...p, status: e.target.value as any }))} style={inputStyle}>
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Monthly revenue ($)</label>
                  <input type="number" value={restDraft.monthly_revenue} onChange={e => setRestDraft(p => ({ ...p, monthly_revenue: e.target.value }))} style={inputStyle} placeholder="0" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button style={btnPrimary} onClick={async () => { if (!restDraft.name) return; await supabase.from('biz_restaurants').insert({ ...restDraft, monthly_revenue: parseFloat(restDraft.monthly_revenue) || 0 }); setRestDraft({ name: '', owner_name: '', phone: '', city: '', onboarded_at: '', status: 'trial', monthly_revenue: '' }); setShowRest(false); loadRestaurants() }}>Save</button>
                <button style={btnSecondary} onClick={() => setShowRest(false)}>Cancel</button>
              </div>
            </div>
          )}

          {restaurants.length === 0 ? <Empty text="No restaurants yet. Add your first customer above." /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                  {['Name', 'Owner', 'City', 'Onboarded', 'Status', 'MRR', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {restaurants.map(r => editingRest === r.id ? (
                    <tr key={r.id} style={{ background: '#FEFCF8', borderBottom: '1px solid var(--cream-dark)' }}>
                      {(['name', 'owner_name', 'city', 'onboarded_at'] as const).map(k => (
                        <td key={k} style={tdStyle}><input value={(editRestDraft as any)[k] || ''} onChange={e => setEditRestDraft(p => ({ ...p, [k]: e.target.value }))} style={{ ...inputStyle, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }} /></td>
                      ))}
                      <td style={tdStyle}>
                        <select value={editRestDraft.status} onChange={e => setEditRestDraft(p => ({ ...p, status: e.target.value as any }))} style={{ ...inputStyle, padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}>
                          <option value="trial">Trial</option><option value="active">Active</option><option value="churned">Churned</option>
                        </select>
                      </td>
                      <td style={tdStyle}><input type="number" value={editRestDraft.monthly_revenue ?? ''} onChange={e => setEditRestDraft(p => ({ ...p, monthly_revenue: parseFloat(e.target.value) }))} style={{ ...inputStyle, padding: '0.35rem 0.5rem', fontSize: '0.8rem', width: '80px' }} /></td>
                      <td style={tdStyle}>
                        <button style={btnSmall} onClick={async () => { await supabase.from('biz_restaurants').update(editRestDraft).eq('id', r.id); setEditingRest(null); loadRestaurants() }}>Save</button>
                        <button style={{ ...btnSmall, background: 'transparent', color: 'var(--muted)', marginLeft: '0.25rem' }} onClick={() => setEditingRest(null)}>×</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{r.name}</td>
                      <td style={tdStyle}>{r.owner_name || '—'}</td>
                      <td style={tdStyle}>{r.city || '—'}</td>
                      <td style={tdStyle}>{r.onboarded_at ? new Date(r.onboarded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                      <td style={tdStyle}><Badge label={r.status} color={r.status === 'active' ? '#4A7C59' : r.status === 'trial' ? '#C4A882' : '#9A8878'} /></td>
                      <td style={tdStyle}>{r.monthly_revenue ? `$${r.monthly_revenue.toLocaleString()}` : '—'}</td>
                      <td style={tdStyle}>
                        <button style={btnSmall} onClick={() => { setEditingRest(r.id); setEditRestDraft({ ...r }) }}>Edit</button>
                        <button style={{ ...btnSmall, background: 'transparent', color: '#C1714F', marginLeft: '0.25rem' }} onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('biz_restaurants').delete().eq('id', r.id); loadRestaurants() }}>Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ══ 2. CUSTOMER HEALTH ══════════════════════════════════════════════ */}
        <section id="health" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Customer Health" />
          {restaurants.filter(r => r.status !== 'churned').length === 0 ? <Empty text="Add restaurants first to track their health." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {restaurants.filter(r => r.status !== 'churned').map(r => {
                const h = health.find(h => h.restaurant_id === r.id)
                const isAtRisk = h?.satisfaction === 'at_risk'
                const isEditing = editingHealth === r.id
                return (
                  <div key={r.id} style={{ background: 'white', border: `1px solid ${isAtRisk ? '#C1714F' : 'var(--cream-dark)'}`, borderLeft: `4px solid ${isAtRisk ? '#C1714F' : h?.satisfaction === 'happy' ? '#4A7C59' : 'var(--cream-dark)'}`, borderRadius: '4px', padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{r.name}</p>
                          {isAtRisk && <span style={{ background: '#C1714F', color: 'white', fontFamily: 'var(--font-dm-sans)', fontSize: '0.55rem', letterSpacing: '0.2em', padding: '2px 8px', borderRadius: '2px', textTransform: 'uppercase' }}>At Risk</span>}
                          {h && <Badge label={h.satisfaction.replace('_', ' ')} color={SAT_COLORS[h.satisfaction]} />}
                        </div>
                        {isEditing ? (
                          <div style={formGrid}>
                            <div><label style={labelStyle}>Last order</label><input type="date" defaultValue={h?.last_order_at || ''} onChange={e => setEditHealthDraft(p => ({ ...p, last_order_at: e.target.value }))} style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.35rem 0.5rem' }} /></div>
                            <div><label style={labelStyle}>Last engaged</label><input type="date" defaultValue={h?.last_engaged_at || ''} onChange={e => setEditHealthDraft(p => ({ ...p, last_engaged_at: e.target.value }))} style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.35rem 0.5rem' }} /></div>
                            <div><label style={labelStyle}>Open complaints</label><input defaultValue={h?.open_complaints || ''} onChange={e => setEditHealthDraft(p => ({ ...p, open_complaints: e.target.value }))} style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.35rem 0.5rem' }} placeholder="None" /></div>
                            <div><label style={labelStyle}>Satisfaction</label>
                              <select defaultValue={h?.satisfaction || 'happy'} onChange={e => setEditHealthDraft(p => ({ ...p, satisfaction: e.target.value as any }))} style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}>
                                <option value="happy">Happy</option><option value="neutral">Neutral</option><option value="at_risk">At Risk</option>
                              </select>
                            </div>
                            <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Notes</label><input defaultValue={h?.notes || ''} onChange={e => setEditHealthDraft(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.35rem 0.5rem', width: '100%', boxSizing: 'border-box' }} placeholder="Notes…" /></div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <HealthField label="Last order" value={h?.last_order_at ? fmt(h.last_order_at) : '—'} />
                            <HealthField label="Last engaged" value={h?.last_engaged_at ? fmt(h.last_engaged_at) : '—'} />
                            <HealthField label="Open complaints" value={h?.open_complaints || 'None'} />
                            {h?.notes && <HealthField label="Notes" value={h.notes} />}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {isEditing ? (
                          <>
                            <button style={btnSmall} onClick={async () => {
                              const payload = { restaurant_id: r.id, ...editHealthDraft, updated_at: new Date().toISOString() }
                              if (h) await supabase.from('biz_health').update(payload).eq('id', h.id)
                              else await supabase.from('biz_health').insert(payload)
                              setEditingHealth(null); setEditHealthDraft({}); loadHealth()
                            }}>Save</button>
                            <button style={{ ...btnSmall, background: 'transparent', color: 'var(--muted)' }} onClick={() => setEditingHealth(null)}>×</button>
                          </>
                        ) : (
                          <button style={btnSmall} onClick={() => { setEditingHealth(r.id); setEditHealthDraft(h ? { ...h } : { satisfaction: 'happy' }) }}>Edit</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ══ 3. ACTIVITY LOG ════════════════════════════════════════════════ */}
        <section id="activity" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Activity Log" action="Add entry" onAction={() => setShowActivity(p => !p)} />

          {showActivity && (
            <div style={formCard}>
              <div style={formGrid}>
                <div><label style={labelStyle}>Date</label><input type="date" value={actDraft.date} onChange={e => setActDraft(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Category</label>
                  <select value={actDraft.category} onChange={e => setActDraft(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                    {['sales', 'product', 'legal', 'investor', 'operations', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Note</label><textarea value={actDraft.note} onChange={e => setActDraft(p => ({ ...p, note: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'none', width: '100%', boxSizing: 'border-box' }} placeholder="What happened?" /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button style={btnPrimary} onClick={async () => { if (!actDraft.note) return; await supabase.from('biz_activity').insert(actDraft); setActDraft({ date: today(), category: 'sales', note: '' }); setShowActivity(false); loadActivity() }}>Save</button>
                <button style={btnSecondary} onClick={() => setShowActivity(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <input value={actSearch} onChange={e => setActSearch(e.target.value)} placeholder="Search…" style={{ ...inputStyle, width: '220px' }} />
            <select value={actCat} onChange={e => setActCat(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
              <option value="">All categories</option>
              {['sales', 'product', 'legal', 'investor', 'operations', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {filteredActivity.length === 0 ? <Empty text="No entries yet. Log your first activity above." /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredActivity.map(a => (
                <div key={a.id} style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '0.875rem 1.1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, textAlign: 'right', width: '80px' }}>
                    <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem', color: 'var(--muted)' }}>{fmt(a.date)}</p>
                    <Badge label={a.category} color="var(--muted)" small />
                  </div>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'var(--text)', flex: 1, lineHeight: 1.5 }}>{a.note}</p>
                  <button onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('biz_activity').delete().eq('id', a.id); loadActivity() }} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ══ 4. KEY METRICS ═════════════════════════════════════════════════ */}
        <section id="metrics" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Key Metrics" action="Add snapshot" onAction={() => setShowMetrics(p => !p)} />

          {showMetrics && (
            <div style={formCard}>
              <div style={formGrid}>
                {[['total_restaurants', 'Restaurants'], ['mrr', 'MRR ($)'], ['churn_count', 'Churn count'], ['trials_active', 'Active trials']].map(([k, label]) => (
                  <div key={k}><label style={labelStyle}>{label}</label><input type="number" value={(metDraft as any)[k]} onChange={e => setMetDraft(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} placeholder="0" /></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button style={btnPrimary} onClick={async () => { await supabase.from('biz_metrics').insert({ total_restaurants: parseInt(metDraft.total_restaurants) || 0, mrr: parseFloat(metDraft.mrr) || 0, churn_count: parseInt(metDraft.churn_count) || 0, trials_active: parseInt(metDraft.trials_active) || 0 }); setMetDraft({ total_restaurants: '', mrr: '', churn_count: '', trials_active: '' }); setShowMetrics(false); loadMetrics() }}>Save</button>
                <button style={btnSecondary} onClick={() => setShowMetrics(false)}>Cancel</button>
              </div>
            </div>
          )}

          {metrics.length === 0 ? <Empty text="No metrics logged yet. Add your first weekly snapshot above." /> : (
            <>
              {metrics.length >= 2 && <MRRChart data={[...metrics].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())} />}
              <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                    {['Date', 'Restaurants', 'MRR', 'Churn', 'Trials'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {metrics.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                        <td style={tdStyle}>{fmt(m.recorded_at)}</td>
                        <td style={tdStyle}>{m.total_restaurants}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--wine)' }}>${m.mrr.toLocaleString()}</td>
                        <td style={tdStyle}>{m.churn_count}</td>
                        <td style={tdStyle}>{m.trials_active}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* ══ 5. RUNWAY ══════════════════════════════════════════════════════ */}
        <section id="runway" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Runway Calculator" action="Update figures" onAction={() => setShowRunway(p => !p)} />

          {latestRunway && (
            <div style={{ background: 'white', border: `2px solid ${runwayColor}`, borderRadius: '6px', padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', gap: '3rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.25rem' }}>Months of Runway</p>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '3rem', fontWeight: 700, color: runwayColor, lineHeight: 1 }}>{monthsRunway == null ? '∞' : monthsRunway.toFixed(1)}</p>
                {monthsRunway !== null && monthsRunway < 6 && <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem', color: runwayColor, marginTop: '0.25rem' }}>{monthsRunway < 3 ? '⚠ Critical — under 3 months' : 'Caution — under 6 months'}</p>}
              </div>
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div><p style={{ ...labelStyle, marginBottom: '0.15rem' }}>Bank balance</p><p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600, color: 'var(--text)' }}>${latestRunway.bank_balance.toLocaleString()}</p></div>
                <div><p style={{ ...labelStyle, marginBottom: '0.15rem' }}>Monthly expenses</p><p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600, color: 'var(--text)' }}>${latestRunway.monthly_expenses.toLocaleString()}</p></div>
                <div><p style={{ ...labelStyle, marginBottom: '0.15rem' }}>MRR</p><p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600, color: '#4A7C59' }}>${latestRunway.mrr.toLocaleString()}</p></div>
                <div><p style={{ ...labelStyle, marginBottom: '0.15rem' }}>Net burn</p><p style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 600, color: netBurn && netBurn > 0 ? '#C1714F' : '#4A7C59' }}>{netBurn && netBurn > 0 ? `-$${netBurn.toLocaleString()}` : 'Profitable'}/mo</p></div>
              </div>
            </div>
          )}

          {showRunway && (
            <div style={formCard}>
              <div style={formGrid}>
                {[['bank_balance', 'Bank balance ($)'], ['monthly_expenses', 'Monthly expenses ($)'], ['mrr', 'Current MRR ($)']].map(([k, label]) => (
                  <div key={k}><label style={labelStyle}>{label}</label><input type="number" value={(runDraft as any)[k]} onChange={e => setRunDraft(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} placeholder="0" /></div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button style={btnPrimary} onClick={async () => { await supabase.from('biz_runway').insert({ bank_balance: parseFloat(runDraft.bank_balance) || 0, monthly_expenses: parseFloat(runDraft.monthly_expenses) || 0, mrr: parseFloat(runDraft.mrr) || 0 }); setRunDraft({ bank_balance: '', monthly_expenses: '', mrr: '' }); setShowRunway(false); loadRunway() }}>Save</button>
                <button style={btnSecondary} onClick={() => setShowRunway(false)}>Cancel</button>
              </div>
            </div>
          )}

          {runway.length === 0 && <Empty text="No runway data yet. Add your first entry above." />}
          {runway.length > 1 && (
            <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--cream-dark)' }}>{['Date', 'Balance', 'Expenses', 'MRR', 'Net Burn', 'Runway'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {runway.map(r => {
                    const nb = r.monthly_expenses - r.mrr
                    const mo = nb > 0 ? (r.bank_balance / nb).toFixed(1) : '∞'
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                        <td style={tdStyle}>{fmt(r.recorded_at)}</td>
                        <td style={tdStyle}>${r.bank_balance.toLocaleString()}</td>
                        <td style={tdStyle}>${r.monthly_expenses.toLocaleString()}</td>
                        <td style={tdStyle}>${r.mrr.toLocaleString()}</td>
                        <td style={tdStyle}>{nb > 0 ? `-$${nb.toLocaleString()}` : 'Profitable'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: parseFloat(mo) < 3 ? '#C1714F' : parseFloat(mo) < 6 ? '#C9A87C' : '#4A7C59' }}>{mo} mo</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ══ 6. FUNDRAISING ═════════════════════════════════════════════════ */}
        <section id="fundraising" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Fundraising" action="Add investor" onAction={() => setShowInvestor(p => !p)} />

          {showInvestor && (
            <div style={formCard}>
              <div style={formGrid}>
                {[['name', 'Name *'], ['firm', 'Firm'], ['check_size', 'Check size']].map(([k, label]) => (
                  <div key={k}><label style={labelStyle}>{label}</label><input value={(invDraft as any)[k]} onChange={e => setInvDraft(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} placeholder={label} /></div>
                ))}
                <div><label style={labelStyle}>Stage</label>
                  <select value={invDraft.stage} onChange={e => setInvDraft(p => ({ ...p, stage: e.target.value }))} style={inputStyle}>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Last contacted</label><input type="date" value={invDraft.last_contacted_at} onChange={e => setInvDraft(p => ({ ...p, last_contacted_at: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Notes</label><input value={invDraft.notes} onChange={e => setInvDraft(p => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Notes…" /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button style={btnPrimary} onClick={async () => { if (!invDraft.name) return; await supabase.from('biz_investors').insert(invDraft); setInvDraft({ name: '', firm: '', check_size: '', stage: 'cold', last_contacted_at: '', notes: '' }); setShowInvestor(false); loadInvestors() }}>Save</button>
                <button style={btnSecondary} onClick={() => setShowInvestor(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <button style={invSort === 'stage' ? btnSmallActive : btnSmall} onClick={() => setInvSort('stage')}>By stage</button>
            <button style={invSort === 'name' ? btnSmallActive : btnSmall} onClick={() => setInvSort('name')}>By name</button>
          </div>

          {investors.length === 0 ? <Empty text="No investors tracked yet. Add your first conversation above." /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--cream-dark)' }}>{['Name', 'Firm', 'Check', 'Stage', 'Last contact', 'Notes', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {sortedInvestors.map(inv => editingInv === inv.id ? (
                    <tr key={inv.id} style={{ background: '#FEFCF8', borderBottom: '1px solid var(--cream-dark)' }}>
                      {(['name', 'firm', 'check_size'] as const).map(k => <td key={k} style={tdStyle}><input value={(editInvDraft as any)[k] || ''} onChange={e => setEditInvDraft(p => ({ ...p, [k]: e.target.value }))} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} /></td>)}
                      <td style={tdStyle}><select value={editInvDraft.stage} onChange={e => setEditInvDraft(p => ({ ...p, stage: e.target.value }))} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                      <td style={tdStyle}><input type="date" value={editInvDraft.last_contacted_at || ''} onChange={e => setEditInvDraft(p => ({ ...p, last_contacted_at: e.target.value }))} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} /></td>
                      <td style={tdStyle}><input value={editInvDraft.notes || ''} onChange={e => setEditInvDraft(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} /></td>
                      <td style={tdStyle}><button style={btnSmall} onClick={async () => { await supabase.from('biz_investors').update(editInvDraft).eq('id', inv.id); setEditingInv(null); loadInvestors() }}>Save</button></td>
                    </tr>
                  ) : (
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--cream-dark)' }}>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{inv.name}</td>
                      <td style={tdStyle}>{inv.firm || '—'}</td>
                      <td style={tdStyle}>{inv.check_size || '—'}</td>
                      <td style={tdStyle}><Badge label={inv.stage} color={STAGE_COLORS[inv.stage]} /></td>
                      <td style={tdStyle}>{inv.last_contacted_at ? fmt(inv.last_contacted_at) : '—'}</td>
                      <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.notes || '—'}</td>
                      <td style={tdStyle}>
                        <button style={btnSmall} onClick={() => { setEditingInv(inv.id); setEditInvDraft({ ...inv }) }}>Edit</button>
                        <button style={{ ...btnSmall, background: 'transparent', color: '#C1714F', marginLeft: '0.25rem' }} onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('biz_investors').delete().eq('id', inv.id); loadInvestors() }}>Del</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ══ 7. RELATIONSHIPS ═══════════════════════════════════════════════ */}
        <section id="relationships" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Relationships" action="Add contact" onAction={() => setShowRelation(p => !p)} />

          {showRelation && (
            <div style={formCard}>
              <div style={formGrid}>
                {[['name', 'Name *'], ['company', 'Company']].map(([k, label]) => (
                  <div key={k}><label style={labelStyle}>{label}</label><input value={(relDraft as any)[k]} onChange={e => setRelDraft(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} placeholder={label} /></div>
                ))}
                <div><label style={labelStyle}>Type</label>
                  <select value={relDraft.type} onChange={e => setRelDraft(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                    {['investor', 'partner', 'legal', 'press', 'advisor', 'supplier'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Last contacted</label><input type="date" value={relDraft.last_contacted_at} onChange={e => setRelDraft(p => ({ ...p, last_contacted_at: e.target.value }))} style={inputStyle} /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Notes</label><input value={relDraft.notes} onChange={e => setRelDraft(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Notes…" /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button style={btnPrimary} onClick={async () => { if (!relDraft.name) return; await supabase.from('biz_relationships').insert(relDraft); setRelDraft({ name: '', company: '', type: 'partner', last_contacted_at: '', notes: '' }); setShowRelation(false); loadRelationships() }}>Save</button>
                <button style={btnSecondary} onClick={() => setShowRelation(false)}>Cancel</button>
              </div>
            </div>
          )}

          {relationships.length === 0 ? <Empty text="No contacts tracked yet. Add your key relationships above." /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid var(--cream-dark)' }}>{['Name', 'Company', 'Type', 'Last contact', 'Notes', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                <tbody>
                  {relationships.map(rel => {
                    const overdue = isOverdue(rel.last_contacted_at)
                    return editingRel === rel.id ? (
                      <tr key={rel.id} style={{ background: '#FEFCF8', borderBottom: '1px solid var(--cream-dark)' }}>
                        {(['name', 'company'] as const).map(k => <td key={k} style={tdStyle}><input value={(editRelDraft as any)[k] || ''} onChange={e => setEditRelDraft(p => ({ ...p, [k]: e.target.value }))} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} /></td>)}
                        <td style={tdStyle}><select value={editRelDraft.type} onChange={e => setEditRelDraft(p => ({ ...p, type: e.target.value }))} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}>{['investor', 'partner', 'legal', 'press', 'advisor', 'supplier'].map(t => <option key={t} value={t}>{t}</option>)}</select></td>
                        <td style={tdStyle}><input type="date" value={editRelDraft.last_contacted_at || ''} onChange={e => setEditRelDraft(p => ({ ...p, last_contacted_at: e.target.value }))} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} /></td>
                        <td style={tdStyle}><input value={editRelDraft.notes || ''} onChange={e => setEditRelDraft(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} /></td>
                        <td style={tdStyle}><button style={btnSmall} onClick={async () => { await supabase.from('biz_relationships').update(editRelDraft).eq('id', rel.id); setEditingRel(null); loadRelationships() }}>Save</button></td>
                      </tr>
                    ) : (
                      <tr key={rel.id} style={{ borderBottom: '1px solid var(--cream-dark)', background: overdue ? 'rgba(193,113,79,0.04)' : undefined }}>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{rel.name}</td>
                        <td style={tdStyle}>{rel.company || '—'}</td>
                        <td style={tdStyle}><Badge label={rel.type} color="var(--muted)" /></td>
                        <td style={tdStyle}>
                          <span style={{ color: overdue ? '#C1714F' : 'var(--text)' }}>{rel.last_contacted_at ? fmt(rel.last_contacted_at) : '—'}</span>
                          {overdue && <span style={{ marginLeft: '0.4rem', fontSize: '0.6rem', color: '#C1714F', fontFamily: 'var(--font-dm-sans)' }}>overdue</span>}
                        </td>
                        <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rel.notes || '—'}</td>
                        <td style={tdStyle}>
                          <button style={btnSmall} onClick={() => { setEditingRel(rel.id); setEditRelDraft({ ...rel }) }}>Edit</button>
                          <button style={{ ...btnSmall, background: 'transparent', color: '#C1714F', marginLeft: '0.25rem' }} onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('biz_relationships').delete().eq('id', rel.id); loadRelationships() }}>Del</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ══ 8. MILESTONES ══════════════════════════════════════════════════ */}
        <section id="milestones" style={{ marginBottom: '4rem' }}>
          <SectionHeader title="Milestone Log" action="Add milestone" onAction={() => setShowMilestone(p => !p)} />

          {showMilestone && (
            <div style={formCard}>
              <div style={formGrid}>
                <div><label style={labelStyle}>Date</label><input type="date" value={milDraft.date} onChange={e => setMilDraft(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Title *</label><input value={milDraft.title} onChange={e => setMilDraft(p => ({ ...p, title: e.target.value }))} style={inputStyle} placeholder="e.g. First paying customer" /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={labelStyle}>Note (optional)</label><textarea value={milDraft.note} onChange={e => setMilDraft(p => ({ ...p, note: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none', width: '100%', boxSizing: 'border-box' }} placeholder="More context…" /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button style={btnPrimary} onClick={async () => { if (!milDraft.title) return; await supabase.from('biz_milestones').insert(milDraft); setMilDraft({ date: today(), title: '', note: '' }); setShowMilestone(false); loadMilestones() }}>Save</button>
                <button style={btnSecondary} onClick={() => setShowMilestone(false)}>Cancel</button>
              </div>
            </div>
          )}

          {milestones.length === 0 ? <Empty text="No milestones yet. Every great company starts with a first one." /> : (
            <div style={{ position: 'relative', paddingLeft: '2rem' }}>
              <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '1px', background: 'var(--cream-dark)' }} />
              {milestones.map((m, i) => (
                <div key={m.id} style={{ position: 'relative', marginBottom: i === milestones.length - 1 ? 0 : '1.5rem' }}>
                  <div style={{ position: 'absolute', left: '-1.7rem', top: '0.35rem', width: '10px', height: '10px', background: 'var(--wine)', borderRadius: '50%', border: '2px solid #FAF8F4' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.68rem', color: 'var(--muted)', marginBottom: '0.2rem' }}>{fmt(m.date)}</p>
                      <p className="font-serif" style={{ fontSize: '1.1rem', color: 'var(--text)', fontWeight: 400 }}>{m.title}</p>
                      {m.note && <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', lineHeight: 1.5 }}>{m.note}</p>}
                    </div>
                    <button onClick={async () => { if (!confirm('Delete?')) return; await supabase.from('biz_milestones').delete().eq('id', m.id); loadMilestones() }} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0] }
function fmt(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
function isOverdue(d: string | null) { if (!d) return true; return Date.now() - new Date(d).getTime() > 30 * 86400000 }

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--cream-dark)', paddingBottom: '0.75rem' }}>
      <h2 className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--wine)' }}>{title}</h2>
      {action && <button onClick={onAction} style={btnPrimary}>{action}</button>}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '0.875rem 1.25rem', minWidth: '120px' }}>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.25rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '1.4rem', fontWeight: 700, color: accent ? 'var(--wine)' : 'var(--text)', lineHeight: 1 }}>{value}</p>
    </div>
  )
}

function Badge({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <span style={{ display: 'inline-block', padding: small ? '1px 6px' : '2px 8px', background: `${color}18`, border: `1px solid ${color}40`, borderRadius: '2px', fontFamily: 'var(--font-dm-sans)', fontSize: small ? '0.58rem' : '0.62rem', letterSpacing: '0.15em', textTransform: 'uppercase', color }}>
      {label}
    </span>
  )
}

function HealthField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.1rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem', color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', borderStyle: 'dashed' }}>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'var(--muted)', fontStyle: 'italic' }}>{text}</p>
    </div>
  )
}

function MRRChart({ data }: { data: { mrr: number; recorded_at: string }[] }) {
  const W = 800, H = 160, padX = 16, padY = 20
  const maxMRR = Math.max(...data.map(d => d.mrr), 1)
  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (W - padX * 2)
    const y = padY + (1 - d.mrr / maxMRR) * (H - padY * 2)
    return { x, y, mrr: d.mrr, date: d.recorded_at }
  })
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const area = `${points[0].x},${H} ${polyline} ${points[points.length - 1].x},${H}`
  return (
    <div style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1rem', marginBottom: '1rem' }}>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.75rem' }}>MRR over time</p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <polygon points={area} fill="rgba(107,39,55,0.06)" />
        <polyline points={polyline} fill="none" stroke="var(--wine)" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="var(--wine)" />
            <text x={p.x} y={H - 2} textAnchor="middle" style={{ fontSize: '9px', fill: '#9A8878', fontFamily: 'DM Sans, sans-serif' }}>
              {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </text>
          </g>
        ))}
        <text x={points[points.length - 1].x + 6} y={points[points.length - 1].y + 4} style={{ fontSize: '10px', fill: 'var(--wine)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
          ${points[points.length - 1].mrr.toLocaleString()}
        </text>
      </svg>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = { background: 'var(--corner-linen)', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '0.55rem 0.75rem', fontFamily: 'var(--font-dm-sans)', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '0.3rem' }
const formCard: React.CSSProperties = { background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', padding: '1.25rem', marginBottom: '1.25rem' }
const formGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.875rem' }
const btnPrimary: React.CSSProperties = { background: 'var(--wine)', color: 'var(--cream)', padding: '0.5rem 1.1rem', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { background: 'transparent', color: 'var(--muted)', padding: '0.5rem 1rem', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', border: '1px solid var(--cream-dark)', cursor: 'pointer' }
const btnSmall: React.CSSProperties = { background: 'var(--cream-dark)', color: 'var(--text)', padding: '0.3rem 0.65rem', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.1em', border: 'none', cursor: 'pointer' }
const btnSmallActive: React.CSSProperties = { ...btnSmall, background: 'var(--wine)', color: 'var(--cream)' }
const thStyle: React.CSSProperties = { fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted)', padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 400, whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem', color: 'var(--text)', padding: '0.65rem 0.75rem', verticalAlign: 'middle' }
