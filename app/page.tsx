'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

// ── Animation system ──────────────────────────────────────────────────────────

const CSS = `
@keyframes heroUp {
  from { opacity:0; transform:translateY(32px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes heroBadge {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes lineDraw {
  from { width:0; }
  to   { width:100%; }
}
.h-badge { animation: heroBadge 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
.h-1     { animation: heroUp   0.75s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
.h-2     { animation: heroUp   0.75s cubic-bezier(0.22,1,0.36,1) 0.32s both; }
.h-sub   { animation: heroUp   0.7s  cubic-bezier(0.22,1,0.36,1) 0.46s both; }
.h-ctas  { animation: heroUp   0.7s  cubic-bezier(0.22,1,0.36,1) 0.58s both; }
.h-note  { animation: heroUp   0.6s  cubic-bezier(0.22,1,0.36,1) 0.7s both; }

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

.loop-connector {
  opacity:0; width:0;
  transition: opacity 0.1s, width 0.5s cubic-bezier(0.22,1,0.36,1);
}
.loop-active .loop-connector { opacity:1; }
.loop-active .loop-c1 { width:100%; transition-delay:0.15s; }
.loop-active .loop-c2 { width:100%; transition-delay:0.35s; }
.loop-active .loop-c3 { width:100%; transition-delay:0.55s; }

.loop-step {
  opacity:0; transform:translateY(20px);
  transition: opacity 0.5s cubic-bezier(0.22,1,0.36,1),
              transform 0.5s cubic-bezier(0.22,1,0.36,1);
}
.loop-active .loop-step:nth-child(1) { opacity:1; transform:none; transition-delay:0.00s; }
.loop-active .loop-step:nth-child(3) { opacity:1; transform:none; transition-delay:0.20s; }
.loop-active .loop-step:nth-child(5) { opacity:1; transform:none; transition-delay:0.40s; }
.loop-active .loop-step:nth-child(7) { opacity:1; transform:none; transition-delay:0.60s; }

@media (max-width: 680px) {
  .loop-connector { display:none; }
  .loop-step { opacity:0; transform:translateY(16px); }
  .loop-active .loop-step:nth-child(1) { opacity:1; transform:none; transition-delay:0.05s; }
  .loop-active .loop-step:nth-child(3) { opacity:1; transform:none; transition-delay:0.15s; }
  .loop-active .loop-step:nth-child(5) { opacity:1; transform:none; transition-delay:0.25s; }
  .loop-active .loop-step:nth-child(7) { opacity:1; transform:none; transition-delay:0.35s; }
}
`

function useReveal(stagger = false, threshold = 0.12) {
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

function useLoopReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('loop-active'); io.disconnect() } },
      { threshold: 0.1 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return ref
}

// ── Data ──────────────────────────────────────────────────────────────────────

const LOOP_STEPS = [
  { num: '01', icon: '↑', label: 'Staff flags it', quote: '"Running low on oat milk"', sub: 'One tap. Takes three seconds.' },
  { num: '02', icon: '⊡', label: 'Owner sees it', quote: '"3 items need reorder"', sub: 'Live on the reorder board.' },
  { num: '03', icon: '✦', label: 'Grace drafts the email', quote: '"Hi Oak & Grain — we need…"', sub: 'AI writes it. You edit and send.' },
  { num: '04', icon: '✓', label: 'Supplier confirms', quote: '"Confirmed for Thursday"', sub: 'One-click link, delivery date returned.' },
]

const ROLES = [
  {
    key: 'staff', label: 'Staff', href: '/cellar/staff',
    accent: '#C9A87C', text: '#3B2A1A',
    desc: 'The team's daily checklist.',
    features: ['Flag low stock in one tap', 'Mark items out of stock', 'Count inventory with +/−', 'Weekly staples pre-checked', 'Below-par alerts in real time'],
  },
  {
    key: 'kitchen', label: 'Kitchen', href: '/cellar/kitchen',
    accent: '#3B2A1A', text: '#FAF8F4',
    desc: 'The prep queue, live.',
    features: ['Real-time kitchen task board', 'Mark in progress or done', 'Urgent tasks surface first', 'Distraction-free for the line'],
  },
  {
    key: 'owner', label: 'Owner', href: '/cellar/owner',
    accent: '#6B2737', text: '#FAF8F4',
    desc: 'Command center for reorders.',
    features: ['All flags in one view', 'AI-drafted supplier emails', 'Supplier confirmation loop', 'Below-par from staff counts', 'Full order history'],
  },
  {
    key: 'artisan', label: 'Grace ✦', href: '/cellar/artisan',
    accent: '#C9A87C', text: '#3B2A1A',
    desc: 'Your AI back-of-house brain.',
    features: ['Knows your actual menu', 'Real-time inventory context', 'Recipes, pairings, prep Q&A', 'Multi-turn conversation', 'Trained on your voice'],
  },
]

const WHY = [
  {
    n: '01', title: 'AI-native, not AI-added',
    body: 'Corner was built around Claude from day one. Paste your menu — inventory is live in seconds. Grace knows your actual wine list, your suppliers, and your team\'s voice.',
  },
  {
    n: '02', title: 'Zero training. Works on any phone.',
    body: 'Staff open a link, tap their name, and they\'re working. No app download, no account. Every role has exactly what it needs and nothing it doesn\'t.',
  },
  {
    n: '03', title: 'Closes the full ordering loop',
    body: 'Most tools tell you what\'s low. Corner tells your supplier, gets confirmation back, and tracks delivery. Flag → order → confirm → receive, all in one place.',
  },
  {
    n: '04', title: 'Built for independent restaurants',
    body: 'MarketMan and BlueCart are built for chains. Corner is for the owner who\'s also on the floor Saturday night. Setup takes fifteen minutes.',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const loopHeaderRef = useReveal()
  const loopRef       = useLoopReveal()
  const rolesHeaderRef = useReveal()
  const rolesRef      = useReveal(true)
  const whyHeaderRef  = useReveal()
  const whyRef        = useReveal(true)
  const setupHeaderRef = useReveal()
  const setupRef      = useReveal(true)
  const storyRef      = useReveal()
  const demoRef       = useReveal()

  return (
    <main style={{ background: '#FAF8F4', color: '#3B2A1A', fontFamily: 'inherit', overflowX: 'hidden' }}>
      <style>{CSS}</style>

      {/* ── Nav ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,248,244,0.95)',
        borderBottom: '1px solid #EDE4D8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem 1.5rem',
        backdropFilter: 'blur(10px)',
      }}>
        <Link href="/ops" className="font-serif" style={{ fontSize: '1rem', letterSpacing: '0.55em', paddingLeft: '0.55em', color: '#3B2A1A', textDecoration: 'none' }}>
          corner
        </Link>
        <Link href="/setup" style={{
          fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-sans)', color: '#FAF8F4',
          background: '#3B2A1A', padding: '0.55rem 1.1rem', borderRadius: '2px',
          textDecoration: 'none',
        }}>
          get started →
        </Link>
      </header>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '6rem 2rem 5rem',
        background: 'linear-gradient(168deg, #FAF8F4 0%, #EDE4D8 55%, #E2D5C4 100%)',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(107,39,55,0.04) 0%, transparent 60%), radial-gradient(circle at 70% 20%, rgba(196,168,130,0.08) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <p className="h-badge" style={{ fontSize: '0.6rem', letterSpacing: '0.42em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '2rem' }}>
          back-of-house intelligence
        </p>

        <h1 className="h-1 font-serif" style={{ fontSize: 'clamp(2.8rem, 9vw, 5rem)', fontWeight: 300, lineHeight: 1.1, color: '#3B2A1A', marginBottom: '0.2rem', maxWidth: '700px' }}>
          The restaurant
        </h1>
        <h1 className="h-2 font-serif" style={{ fontSize: 'clamp(2.8rem, 9vw, 5rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.1, color: '#3B2A1A', marginBottom: '2.25rem', maxWidth: '700px' }}>
          that runs itself.
        </h1>

        <p className="h-sub" style={{ maxWidth: '440px', fontSize: '1rem', lineHeight: 1.72, color: '#6B5744', fontFamily: 'var(--font-dm-sans)', marginBottom: '2.75rem' }}>
          Corner connects your staff, kitchen, and owner — with AI that flags what's low, writes the order email, and closes the loop end-to-end.
        </p>

        <div className="h-ctas" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/setup" style={{
            padding: '0.95rem 2.25rem', background: '#3B2A1A', color: '#FAF8F4',
            fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            fontFamily: 'var(--font-dm-sans)', borderRadius: '2px', textDecoration: 'none',
          }}>
            start your restaurant →
          </Link>
          <a href="#demo" style={{
            padding: '0.95rem 2.25rem', border: '1px solid #C9A87C', color: '#3B2A1A',
            fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            fontFamily: 'var(--font-dm-sans)', background: 'transparent', textDecoration: 'none', borderRadius: '2px',
          }}>
            try the demo
          </a>
        </div>

        <p className="h-note" style={{ marginTop: '1.75rem', fontSize: '0.72rem', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.05em' }}>
          Free to set up · No app download · Works on any phone
        </p>
      </section>

      {/* ── The Ordering Loop ── */}
      <section style={{ padding: '6rem 1.5rem', background: 'var(--wine-dark)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <div className="r" ref={loopHeaderRef} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem', opacity: 0.7 }}>the differentiator</p>
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 300, color: '#FAF8F4', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              The ordering loop,<br />finally closed.
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'rgba(250,248,244,0.55)', fontFamily: 'var(--font-dm-sans)', maxWidth: '380px', margin: '0 auto', lineHeight: 1.65 }}>
              Most tools tell you what's low. Corner takes it all the way to supplier confirmation — automatically.
            </p>
          </div>

          {/* Loop steps */}
          <div ref={loopRef} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
            {LOOP_STEPS.map((step, i) => (
              <>
                <div key={step.num} className="loop-step" style={{ flex: '1 1 160px', maxWidth: '200px', textAlign: 'center', padding: '0 0.5rem', marginBottom: '2rem' }}>
                  <div style={{ width: '48px', height: '48px', border: '1px solid rgba(196,168,130,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.1rem', color: 'var(--gold)' }}>
                    {step.icon}
                  </div>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.55rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(196,168,130,0.5)', marginBottom: '0.35rem' }}>{step.num}</p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.82rem', fontWeight: 600, color: '#FAF8F4', marginBottom: '0.5rem', lineHeight: 1.3 }}>{step.label}</p>
                  <p className="font-serif" style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--gold)', marginBottom: '0.4rem', lineHeight: 1.4 }}>{step.quote}</p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.72rem', color: 'rgba(250,248,244,0.4)', lineHeight: 1.5 }}>{step.sub}</p>
                </div>
                {i < LOOP_STEPS.length - 1 && (
                  <div key={`c${i}`} style={{ display: 'flex', alignItems: 'center', paddingTop: '24px', flex: '0 0 auto', width: '40px' }}>
                    <div className={`loop-connector loop-c${i + 1}`} style={{ height: '1px', background: 'linear-gradient(90deg, rgba(196,168,130,0.5), rgba(196,168,130,0.2))', position: 'relative' }}>
                      <span style={{ position: 'absolute', right: '-3px', top: '-4px', color: 'rgba(196,168,130,0.5)', fontSize: '8px' }}>›</span>
                    </div>
                  </div>
                )}
              </>
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
                <Link href={role.href} style={{ fontSize: '0.55rem', letterSpacing: '0.28em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)', color: role.text, opacity: 0.6, textDecoration: 'none' }}>
                  try demo →
                </Link>
              </div>
              <ul style={{ padding: '1rem 1.25rem', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {role.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.82rem', color: '#5C4033', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.5 }}>
                    <span style={{ color: '#C9A87C', flexShrink: 0, marginTop: '0.1em' }}>—</span>
                    {f}
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
            <h2 className="font-serif" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 300, color: '#3B2A1A' }}>Not another POS add-on.</h2>
          </div>

          <div ref={whyRef} className="s" style={{ display: 'flex', flexDirection: 'column' }}>
            {WHY.map((w, i) => (
              <div key={w.n} style={{ padding: '1.75rem 0', borderTop: i > 0 ? '1px solid rgba(59,42,26,0.12)' : undefined, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'start' }}>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.58rem', letterSpacing: '0.2em', color: '#B8A99A', paddingTop: '0.25rem' }}>{w.n}</span>
                <div>
                  <p className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 300, color: '#3B2A1A', marginBottom: '0.4rem' }}>{w.title}</p>
                  <p style={{ fontSize: '0.85rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.7 }}>{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Setup in 3 steps ── */}
      <section style={{ padding: '6rem 1.5rem', maxWidth: '720px', margin: '0 auto' }}>
        <div className="r" ref={setupHeaderRef} style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem' }}>getting started</p>
          <h2 className="font-serif" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 300, color: '#3B2A1A' }}>Up and running in 15 minutes.</h2>
        </div>

        <div ref={setupRef} className="s" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[
            { n: '1', title: 'Paste your menu', body: 'AI extracts every item into a live inventory with categories already set.' },
            { n: '2', title: 'Share the links', body: 'Send each role their link. No passwords, no apps — they\'re working in seconds.' },
            { n: '3', title: 'Corner handles the rest', body: 'Flags, order emails, supplier confirmations, kitchen queue — all automatic.' },
          ].map(s => (
            <div key={s.n} style={{ background: 'white', border: '1px solid #EDE4D8', borderRadius: '4px', padding: '1.5rem 1.25rem' }}>
              <div style={{ width: '32px', height: '32px', border: '1px solid #EDE4D8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', fontSize: '0.7rem', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)' }}>{s.n}</div>
              <p className="font-serif" style={{ fontSize: '1.05rem', color: '#3B2A1A', marginBottom: '0.4rem' }}>{s.title}</p>
              <p style={{ fontSize: '0.82rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.65 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Founder story ── */}
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
              After countless shifts yelling "corner!" in increasingly ridiculous voices, the name felt right. So did the mission: give independent restaurants the back-of-house intelligence that only big chains could afford — powered by AI, built for the owner who's also on the floor.
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
            The Cellar is a live demo restaurant. Walk in as any role.
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
        <Link href="/ops" className="font-serif" style={{ fontSize: '0.85rem', letterSpacing: '0.4em', paddingLeft: '0.4em', color: '#B8A99A', textDecoration: 'none' }}>
          corner
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/setup" style={{ fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}>
            set up your restaurant
          </Link>
          <Link href="/cellar/admin" style={{ fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', textDecoration: 'none' }}>
            demo admin
          </Link>
        </div>
      </footer>
    </main>
  )
}
