'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

// ── Animation system ──────────────────────────────────────────────────────────

const CSS = `
@keyframes heroUp {
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes heroBadge {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes pulse {
  0%,100% { opacity:0.5; transform:scale(1); }
  50%      { opacity:1;   transform:scale(1.04); }
}
.h-badge    { animation: heroBadge 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
.h-headline { animation: heroUp   0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
.h-sub      { animation: heroUp   0.7s cubic-bezier(0.22,1,0.36,1) 0.42s both; }
.h-ctas     { animation: heroUp   0.7s cubic-bezier(0.22,1,0.36,1) 0.56s both; }
.h-note     { animation: heroUp   0.6s cubic-bezier(0.22,1,0.36,1) 0.68s both; }

.r {
  opacity:0; transform:translateY(22px);
  transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1),
              transform 0.65s cubic-bezier(0.22,1,0.36,1);
}
.r.v { opacity:1; transform:none; }

.s > * {
  opacity:0; transform:translateY(18px);
  transition: opacity 0.55s cubic-bezier(0.22,1,0.36,1),
              transform 0.55s cubic-bezier(0.22,1,0.36,1);
}
.s.v > *:nth-child(1) { opacity:1; transform:none; transition-delay:0.00s; }
.s.v > *:nth-child(2) { opacity:1; transform:none; transition-delay:0.09s; }
.s.v > *:nth-child(3) { opacity:1; transform:none; transition-delay:0.18s; }
.s.v > *:nth-child(4) { opacity:1; transform:none; transition-delay:0.27s; }
.s.v > *:nth-child(5) { opacity:1; transform:none; transition-delay:0.36s; }
.s.v > *:nth-child(6) { opacity:1; transform:none; transition-delay:0.45s; }

.insight-card {
  opacity:0; transform:translateY(14px);
  transition: opacity 0.5s cubic-bezier(0.22,1,0.36,1),
              transform 0.5s cubic-bezier(0.22,1,0.36,1);
}
.insights-active .insight-card:nth-child(1) { opacity:1; transform:none; transition-delay:0.05s; }
.insights-active .insight-card:nth-child(2) { opacity:1; transform:none; transition-delay:0.14s; }
.insights-active .insight-card:nth-child(3) { opacity:1; transform:none; transition-delay:0.23s; }
.insights-active .insight-card:nth-child(4) { opacity:1; transform:none; transition-delay:0.32s; }
.insights-active .insight-card:nth-child(5) { opacity:1; transform:none; transition-delay:0.41s; }
.insights-active .insight-card:nth-child(6) { opacity:1; transform:none; transition-delay:0.50s; }

.grace-bubble {
  opacity:0; transform:translateY(10px);
  transition: opacity 0.45s ease, transform 0.45s ease;
}
.grace-active .grace-bubble:nth-child(1) { opacity:1; transform:none; transition-delay:0.1s; }
.grace-active .grace-bubble:nth-child(2) { opacity:1; transform:none; transition-delay:0.45s; }
.grace-active .grace-bubble:nth-child(3) { opacity:1; transform:none; transition-delay:0.8s; }
.grace-active .grace-bubble:nth-child(4) { opacity:1; transform:none; transition-delay:1.15s; }
`

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('v'); io.disconnect() } },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

function useActivate(cls: string, threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add(cls); io.disconnect() } },
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [cls])
  return ref
}

// ── Data ──────────────────────────────────────────────────────────────────────

const INSIGHTS = [
  { icon: '↑', color: '#C1714F', label: 'Oat milk flagged 4× this week', sub: 'Mostly Tuesday & Friday evenings — adjust your par level.' },
  { icon: '⚠', color: '#C9A87C', label: '3 items below par for 5+ days', sub: 'House hot sauce, Aperol, and lemon haven\'t been restocked.' },
  { icon: '✓', color: '#4A7C59', label: 'Oak & Grain confirms in 2.1 hrs avg', sub: 'Fastest supplier. Last 6 orders all confirmed same day.' },
  { icon: '↗', color: '#6B2737', label: 'Monday is your highest reorder day', sub: 'Weekend service depletes 60% of flagged items by Sunday night.' },
  { icon: '⊡', color: '#8A9167', label: 'Kitchen queue peaks at 6–7pm', sub: '74% of urgent tasks are submitted in the first dinner hour.' },
  { icon: '✦', color: '#C9A87C', label: 'Grace answered 12 questions this week', sub: 'Top topics: pairings, prep notes, and what\'s running low.' },
]

const GRACE_CHAT = [
  { role: 'user', text: 'What\'s been running out most this week?' },
  { role: 'grace', text: 'Oat milk has been flagged 4 times — mostly Tuesday and Friday evenings. House-made hot sauce hasn\'t been counted in 9 days, and you\'re sitting at 1 bottle against a par of 4.' },
  { role: 'user', text: 'Which supplier should I call first?' },
  { role: 'grace', text: 'Oak & Grain — they have oat milk and confirm same-day. Your last order was 11 days ago. Fernwood Provisions has the hot sauce but their last confirmation took 3 days, so reach out today if you need it by the weekend.' },
]

const ROLES = [
  { key: 'staff',   label: 'Staff',     href: '/cellar/staff',   accent: '#C9A87C', text: '#3B2A1A', desc: 'Flag, count, mark out.', features: ['One-tap reorder flags', 'Inventory counts with +/−', 'Weekly staples pre-checked', 'Mark items out of stock', 'Below-par alerts live'] },
  { key: 'kitchen', label: 'Kitchen',   href: '/cellar/kitchen', accent: '#3B2A1A', text: '#FAF8F4', desc: 'The prep queue, live.',    features: ['Real-time task board', 'Mark in progress or done', 'Urgent tasks surface first', 'Distraction-free for the line'] },
  { key: 'owner',   label: 'Owner',     href: '/cellar/owner',   accent: '#6B2737', text: '#FAF8F4', desc: 'Every insight in one view.', features: ['All flags + below-par', 'Order history + delivery status', 'Supplier confirmation tracking', 'Analytics by item, day, team member'] },
  { key: 'artisan', label: 'Grace ✦',   href: '/cellar/artisan', accent: '#C9A87C', text: '#3B2A1A', desc: 'Your AI back-of-house brain.', features: ['Trained on your actual menu', 'Real-time inventory context', 'Supplier history awareness', 'Recipes, pairings, prep Q&A'] },
]

const WHY = [
  { n: '01', title: 'Built on your actual data', body: 'Grace isn\'t a generic chatbot. She\'s trained on your menu, your inventory history, your supplier patterns, and what\'s happening right now — flags, 86s, kitchen queue, below par. She answers questions about your restaurant, not restaurants in general.' },
  { n: '02', title: 'Intelligence that compounds', body: 'Every count your staff submits, every flag they raise, every order you send — Corner learns your restaurant\'s rhythms. Over time, patterns emerge: which items peak on which days, which suppliers are reliable, where waste is hiding.' },
  { n: '03', title: 'Zero training. Works on any phone.', body: 'Staff open a link, tap their name, and they\'re working. No app download, no account. Every role has exactly what it needs and nothing it doesn\'t. The data starts flowing on day one.' },
  { n: '04', title: 'Built for independent owners', body: 'Enterprise tools like MarketMan and BlueCart are built for chains with purchasing teams. Corner is built for the owner who\'s also on the floor Saturday night — giving you the back-of-house intelligence that used to require a full operations team.' },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const insightsHeaderRef = useReveal()
  const insightsRef       = useActivate('insights-active')
  const graceHeaderRef    = useReveal()
  const graceRef          = useActivate('grace-active', 0.2)
  const rolesHeaderRef    = useReveal()
  const rolesRef          = useActivate('s')
  const whyHeaderRef      = useReveal()
  const whyRef            = useActivate('s')
  const setupHeaderRef    = useReveal()
  const setupRef          = useActivate('s')
  const storyRef          = useReveal()
  const demoRef           = useReveal()

  return (
    <main style={{ background: '#FAF8F4', color: '#3B2A1A', fontFamily: 'inherit', overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── Nav ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,248,244,0.95)', borderBottom: '1px solid #EDE4D8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', backdropFilter: 'blur(10px)' }}>
        <Link href="/ops" className="font-serif" style={{ fontSize: '1rem', letterSpacing: '0.55em', paddingLeft: '0.55em', color: '#3B2A1A', textDecoration: 'none' }}>corner</Link>
        <Link href="/setup" style={{ fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', color: '#FAF8F4', background: '#3B2A1A', padding: '0.55rem 1.1rem', borderRadius: '2px', textDecoration: 'none' }}>get started →</Link>
      </header>

      {/* ── Hero ── */}
      <section style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '6rem 2rem 5rem', background: 'linear-gradient(168deg, #FAF8F4 0%, #EDE4D8 55%, #E2D5C4 100%)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(107,39,55,0.04) 0%, transparent 60%), radial-gradient(circle at 70% 20%, rgba(196,168,130,0.08) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <p className="h-badge" style={{ fontSize: '0.6rem', letterSpacing: '0.42em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '2rem' }}>
          back-of-house intelligence
        </p>

        <div className="h-headline" style={{ marginBottom: '2.25rem', textAlign: 'center' }}>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.8rem, 9vw, 5rem)', fontWeight: 300, lineHeight: 1.15, color: '#3B2A1A', maxWidth: '720px', margin: '0 auto' }}>
            Your restaurant knows
          </h1>
          <h1 className="font-serif" style={{ fontSize: 'clamp(2.8rem, 9vw, 5rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.15, color: '#3B2A1A', maxWidth: '720px', margin: '0 auto' }}>
            more than you think.
          </h1>
        </div>

        <p className="h-sub" style={{ maxWidth: '460px', fontSize: '1rem', lineHeight: 1.75, color: '#6B5744', fontFamily: 'var(--font-dm-sans)', marginBottom: '2.75rem' }}>
          Every flag your staff raises, every count they submit, every order you send — Corner turns it into real-time intelligence so you can focus on what you actually love.
        </p>

        <div className="h-ctas" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/setup" style={{ padding: '0.95rem 2.25rem', background: '#3B2A1A', color: '#FAF8F4', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', borderRadius: '2px', textDecoration: 'none' }}>
            start your restaurant →
          </Link>
          <a href="#demo" style={{ padding: '0.95rem 2.25rem', border: '1px solid #C9A87C', color: '#3B2A1A', fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', background: 'transparent', textDecoration: 'none', borderRadius: '2px' }}>
            see it live
          </a>
        </div>

        <p className="h-note" style={{ marginTop: '1.75rem', fontSize: '0.72rem', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)' }}>
          Free to set up · No app download · Works on any phone
        </p>
      </section>

      {/* ── Live Insights ── */}
      <section style={{ padding: '6rem 1.5rem', background: 'var(--wine-dark)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="r" ref={insightsHeaderRef} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem', opacity: 0.7 }}>inventory intelligence</p>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 300, color: '#FAF8F4', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              Your restaurant generates data<br />every shift. Corner reads it.
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(250,248,244,0.5)', fontFamily: 'var(--font-dm-sans)', maxWidth: '420px', margin: '0 auto', lineHeight: 1.65 }}>
              Not just "what's low" — but why it runs out, when it peaks, and what to do about it.
            </p>
          </div>

          <div ref={insightsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {INSIGHTS.map((ins, i) => (
              <div key={i} className="insight-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(196,168,130,0.12)', borderLeft: `3px solid ${ins.color}`, borderRadius: '4px', padding: '1.1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', color: ins.color }}>{ins.icon}</span>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem', fontWeight: 600, color: '#FAF8F4', lineHeight: 1.3 }}>{ins.label}</p>
                </div>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem', color: 'rgba(250,248,244,0.45)', lineHeight: 1.55 }}>{ins.sub}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.68rem', color: 'rgba(250,248,244,0.25)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.05em' }}>
            Insights like these surface automatically as your team uses Corner.
          </p>
        </div>
      </section>

      {/* ── Grace / RAG ── */}
      <section style={{ padding: '6rem 1.5rem', background: '#FAF8F4' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

          <div className="r" ref={graceHeaderRef}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem' }}>meet grace ✦</p>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 300, color: '#3B2A1A', marginBottom: '1rem', lineHeight: 1.25 }}>
              An AI that knows<br /><em>your</em> restaurant.
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.75, marginBottom: '1.25rem' }}>
              Grace is trained on your actual menu, your inventory history, and your supplier patterns. She has real-time access to what's flagged, what's in the kitchen queue, and what's below par right now.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.75, marginBottom: '1.75rem' }}>
              Ask her anything about your operation — and get an answer that's specific to your restaurant, not a generic template.
            </p>
            <Link href="/cellar/artisan" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: 'var(--gold)', color: '#3B2A1A', fontSize: '0.62rem', letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', borderRadius: '2px', textDecoration: 'none' }}>
              Try Grace on The Cellar →
            </Link>
          </div>

          <div ref={graceRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {GRACE_CHAT.map((msg, i) => (
              <div key={i} className="grace-bubble" style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: msg.role === 'user' ? '#3B2A1A' : 'white',
                  border: msg.role === 'grace' ? '1px solid #EDE4D8' : 'none',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.8rem',
                  lineHeight: 1.6,
                  color: msg.role === 'user' ? '#FAF8F4' : '#3B2A1A',
                }}>
                  {msg.role === 'grace' && <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.35rem', fontFamily: 'var(--font-dm-sans)' }}>Grace ✦</p>}
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Roles ── */}
      <section style={{ padding: '6rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <div className="r" ref={rolesHeaderRef} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem' }}>built for every role</p>
          <h2 className="font-serif" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 300, color: '#3B2A1A', marginBottom: '0.5rem' }}>One link per role.</h2>
          <p style={{ fontSize: '0.875rem', color: '#9A8878', fontFamily: 'var(--font-dm-sans)' }}>No logins. No downloads. Zero training required.</p>
        </div>

        <div ref={rolesRef} className="s" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ROLES.map(role => (
            <div key={role.key} style={{ border: '1px solid #EDE4D8', background: 'white', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: role.accent, padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 300, color: role.text }}>{role.label}</span>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.7rem', color: role.text, opacity: 0.65, marginLeft: '0.75rem' }}>{role.desc}</span>
                </div>
                <Link href={role.href} style={{ fontSize: '0.55rem', letterSpacing: '0.28em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', color: role.text, opacity: 0.6, textDecoration: 'none' }}>try demo →</Link>
              </div>
              <ul style={{ padding: '1rem 1.25rem', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {role.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.82rem', color: '#5C4033', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.5 }}>
                    <span style={{ color: '#C9A87C', flexShrink: 0, marginTop: '0.1em' }}>—</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Corner ── */}
      <section style={{ padding: '6rem 1.5rem', background: 'linear-gradient(168deg, #EDE4D8 0%, #E0D4C4 100%)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div className="r" ref={whyHeaderRef} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem' }}>why corner</p>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 300, color: '#3B2A1A', lineHeight: 1.25 }}>
              You didn't open a restaurant<br /><em>to manage spreadsheets.</em>
            </h2>
          </div>

          <div ref={whyRef} className="s" style={{ display: 'flex', flexDirection: 'column' }}>
            {WHY.map((w, i) => (
              <div key={w.n} style={{ padding: '1.75rem 0', borderTop: i > 0 ? '1px solid rgba(59,42,26,0.12)' : undefined, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.2em', color: '#B8A99A', paddingTop: '0.25rem' }}>{w.n}</span>
                <div>
                  <p className="font-serif" style={{ fontSize: '1.1rem', color: '#3B2A1A', marginBottom: '0.4rem' }}>{w.title}</p>
                  <p style={{ fontSize: '0.85rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7 }}>{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Setup ── */}
      <section style={{ padding: '6rem 1.5rem', maxWidth: '720px', margin: '0 auto' }}>
        <div className="r" ref={setupHeaderRef} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem' }}>getting started</p>
          <h2 className="font-serif" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 300, color: '#3B2A1A' }}>Up and running in 15 minutes.</h2>
        </div>
        <div ref={setupRef} className="s" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[
            { n: '1', title: 'Paste your menu', body: 'AI extracts every item into a live inventory with categories already set. No manual data entry.' },
            { n: '2', title: 'Share the links', body: 'Send each role their link. No passwords, no apps — your team is working in seconds.' },
            { n: '3', title: 'Corner learns your restaurant', body: 'Every count, flag, and order builds the intelligence layer. The longer you use it, the smarter it gets.' },
          ].map(s => (
            <div key={s.n} style={{ background: 'white', border: '1px solid #EDE4D8', borderRadius: '4px', padding: '1.5rem 1.25rem' }}>
              <div style={{ width: '32px', height: '32px', border: '1px solid #EDE4D8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '0.7rem', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)' }}>{s.n}</div>
              <p className="font-serif" style={{ fontSize: '1.05rem', color: '#3B2A1A', marginBottom: '0.4rem' }}>{s.title}</p>
              <p style={{ fontSize: '0.82rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.65 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Story ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'linear-gradient(168deg, #FAF8F4 0%, #EDE4D8 100%)' }}>
        <div ref={storyRef} className="r" style={{ maxWidth: '640px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', textAlign: 'center', marginBottom: '3rem' }}>the story</p>
          <div style={{ borderLeft: '3px solid #C9A87C', paddingLeft: '1.75rem' }}>
            <p className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.55, color: '#3B2A1A', marginBottom: '1.5rem' }}>
              "Corner!" — the word you yell every time you round a sharp turn back into the kitchen.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Kylie Marcisz is a UC Berkeley EECS student who has worked in restaurants since she was 15½. She loves the culture — the inside jokes, the controlled chaos, the people who pour everything into their food and their community.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Corner exists because independent restaurants deserve the same operational intelligence that chains spend millions building — without the enterprise software, the consultants, or the six-month implementation. Built for the owner who got into this because they love it, and deserves tools that love them back.
            </p>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)' }}>
              Kylie Marcisz — Founder, Corner
            </p>
          </div>
        </div>
      </section>

      {/* ── Demo ── */}
      <section id="demo" style={{ padding: '6rem 1.5rem 7rem', background: 'var(--wine-dark)', textAlign: 'center' }}>
        <div ref={demoRef} className="r">
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem', opacity: 0.7 }}>demo · the cellar</p>
          <h2 className="font-serif" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 300, color: '#FAF8F4', marginBottom: '0.6rem' }}>Try it now — no sign-up.</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(250,248,244,0.45)', fontFamily: 'var(--font-dm-sans)', marginBottom: '2.75rem' }}>
            The Cellar is a live demo restaurant. Walk in as any role and see the intelligence in action.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '268px', margin: '0 auto' }}>
            {[
              { href: '/cellar/staff',   label: 'staff',       style: { border: '1px solid rgba(196,168,130,0.4)', color: '#FAF8F4', background: 'transparent' } },
              { href: '/cellar/kitchen', label: 'kitchen',     style: { background: 'rgba(255,255,255,0.1)', color: '#FAF8F4', border: '1px solid rgba(255,255,255,0.12)' } },
              { href: '/cellar/owner',   label: 'owner',       style: { border: '1px solid rgba(196,168,130,0.2)', color: 'rgba(250,248,244,0.5)', background: 'transparent' } },
              { href: '/cellar/artisan', label: 'ask grace ✦', style: { background: 'var(--gold)', color: 'var(--wine-dark)' } },
            ].map(r => (
              <Link key={r.href} href={r.href} style={{ display: 'block', textAlign: 'center', padding: '0.95rem 1.5rem', fontSize: '0.65rem', letterSpacing: '0.32em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none', borderRadius: '2px', ...r.style }}>
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #EDE4D8', padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#FAF8F4' }}>
        <Link href="/ops" className="font-serif" style={{ fontSize: '0.85rem', letterSpacing: '0.4em', paddingLeft: '0.4em', color: '#B8A99A', textDecoration: 'none' }}>corner</Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/setup" style={{ fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}>set up your restaurant</Link>
          <Link href="/cellar/admin" style={{ fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}>demo admin</Link>
        </div>
      </footer>
    </main>
  )
}
