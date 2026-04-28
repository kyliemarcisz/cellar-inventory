import Link from 'next/link'

const ROLES = [
  {
    label: 'Staff',
    href: '/cellar/staff',
    accent: '#C9A87C',
    textOnAccent: '#3B2A1A',
    features: [
      'Flag items that need reordering with one tap',
      'Log kitchen tasks and mark them urgent',
      'Count inventory per item with +/− controls',
      'See live amber alerts when stock is below par',
      'Counts are timestamped and tied to your name',
    ],
  },
  {
    label: 'Kitchen',
    href: '/cellar/kitchen',
    accent: '#3B2A1A',
    textOnAccent: '#FAF8F4',
    features: [
      'See all open kitchen tasks in real time',
      'Mark tasks in progress or done',
      'Urgent tasks surface to the top automatically',
      'Clean, distraction-free view built for a busy line',
    ],
  },
  {
    label: 'Owner',
    href: '/cellar/owner',
    accent: '#6B2737',
    textOnAccent: '#FAF8F4',
    features: [
      'Review all pending reorder flags at a glance',
      'See every item below its par level with the exact gap',
      'Mark items ordered — supplier email fires automatically',
      '"Mark all ordered" sends grouped emails per supplier',
      'Full analytics: flag frequency, peak days, team activity',
    ],
  },
  {
    label: 'Admin',
    href: '/cellar/admin',
    accent: '#EDE4D8',
    textOnAccent: '#3B2A1A',
    features: [
      'Paste a menu or upload a PDF — AI extracts your full inventory',
      'Set par levels and units per item',
      'Configure supplier name + email per category',
      'Upload docs to your knowledge base (training guides, recipes)',
      'Create and customize AI personas for your restaurant',
    ],
  },
  {
    label: 'AI Assistant',
    href: '/cellar/artisan',
    accent: '#C9A87C',
    textOnAccent: '#3B2A1A',
    features: [
      'Chat with a persona trained on your restaurant's voice',
      'Answers sourced from your actual menu and uploaded docs',
      'Quick prompts tailored to your venue type',
      'Ask about recipes, pairings, prep, or specials',
      'Multiple personas — bartender, chef, floor manager',
    ],
  },
]

const DIFFERENTIATORS = [
  {
    label: 'AI-native, not AI-added',
    body: 'Corner was built around Claude from day one. Paste your menu and your inventory is live in seconds. Your AI assistant knows your actual wine list, your recipes, and your team's voice — not a generic chatbot.',
  },
  {
    label: 'Runs on a phone, requires no training',
    body: 'Staff open a link, tap their name, and they're working. No app download, no account creation, no onboarding deck. Every role has exactly what it needs and nothing it doesn't.',
  },
  {
    label: 'Closes the loop on ordering',
    body: 'Most tools tell you what's low. Corner tells your supplier. When an owner marks items ordered, a branded email goes out automatically — grouped by supplier, with every flagged item and note included.',
  },
  {
    label: 'Built for independent restaurants',
    body: 'MarketMan and BlueCart are built for chains with purchasing teams. Corner is for the owner who's also on the floor on Saturday night. Setup takes fifteen minutes and the whole team is running by end of shift.',
  },
]

export default function Home() {
  return (
    <main style={{ background: '#FAF8F4', color: '#3B2A1A', fontFamily: 'inherit' }}>

      {/* ── Nav ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(250,248,244,0.96)',
        borderBottom: '1px solid #EDE4D8',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem 1.5rem',
        backdropFilter: 'blur(8px)',
      }}>
        <span className="font-serif" style={{ fontSize: '1rem', letterSpacing: '0.55em', paddingLeft: '0.55em', color: '#3B2A1A' }}>
          corner
        </span>
        <Link href="/setup" style={{
          fontSize: '0.6rem', letterSpacing: '0.28em', textTransform: 'uppercase',
          fontFamily: 'var(--font-dm-sans)', color: '#FAF8F4',
          background: '#3B2A1A', padding: '0.55rem 1.1rem',
        }}>
          get started →
        </Link>
      </header>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '82vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '5rem 2rem 4rem',
        background: 'linear-gradient(168deg, #FAF8F4 0%, #EDE4D8 100%)',
      }}>
        <p style={{
          fontSize: '0.62rem', letterSpacing: '0.38em', textTransform: 'uppercase',
          color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '1.75rem',
        }}>
          back-of-house intelligence
        </p>

        <h1 className="font-serif" style={{
          fontSize: 'clamp(2.4rem, 8vw, 4rem)', fontWeight: 300,
          lineHeight: 1.18, color: '#3B2A1A', letterSpacing: '0.01em',
          marginBottom: '0.4rem', maxWidth: '640px',
        }}>
          The restaurant that
        </h1>
        <h1 className="font-serif" style={{
          fontSize: 'clamp(2.4rem, 8vw, 4rem)', fontWeight: 300,
          fontStyle: 'italic', lineHeight: 1.18, color: '#3B2A1A',
          letterSpacing: '0.01em', marginBottom: '2rem', maxWidth: '640px',
        }}>
          runs itself.
        </h1>

        <p style={{
          maxWidth: '420px', fontSize: '0.95rem', lineHeight: 1.7,
          color: '#6B5744', fontFamily: 'var(--font-dm-sans)',
          marginBottom: '2.75rem',
        }}>
          Corner connects your staff, kitchen, and owner on one platform — with AI that knows your menu, your suppliers, and your team.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/setup" style={{
            padding: '0.9rem 2rem', background: '#3B2A1A', color: '#FAF8F4',
            fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            fontFamily: 'var(--font-dm-sans)',
          }}>
            start your restaurant →
          </Link>
          <a href="#demo" style={{
            padding: '0.9rem 2rem', border: '1px solid #C9A87C', color: '#3B2A1A',
            fontSize: '0.62rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            fontFamily: 'var(--font-dm-sans)', background: 'transparent',
          }}>
            try the demo
          </a>
        </div>
      </section>

      {/* ── Role features ── */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '720px', margin: '0 auto' }}>
        <p style={{
          fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase',
          color: '#B8A99A', fontFamily: 'var(--font-dm-sans)',
          textAlign: 'center', marginBottom: '0.75rem',
        }}>
          built for every role
        </p>
        <h2 className="font-serif" style={{
          fontSize: '1.85rem', fontWeight: 300, textAlign: 'center',
          marginBottom: '3.5rem', color: '#3B2A1A',
        }}>
          One link per role. Zero training required.
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {ROLES.map(role => (
            <div key={role.label} style={{
              border: '1px solid #EDE4D8', background: 'white',
              overflow: 'hidden',
            }}>
              <div style={{
                background: role.accent, padding: '0.9rem 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span className="font-serif" style={{
                  fontSize: '1.1rem', fontWeight: 300, color: role.textOnAccent,
                }}>
                  {role.label}
                </span>
                <Link href={role.href} style={{
                  fontSize: '0.55rem', letterSpacing: '0.28em', textTransform: 'uppercase',
                  fontFamily: 'var(--font-dm-sans)', color: role.textOnAccent,
                  opacity: 0.7, textDecoration: 'none',
                }}>
                  try demo →
                </Link>
              </div>
              <ul style={{ padding: '1.1rem 1.25rem', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {role.features.map(f => (
                  <li key={f} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                    fontSize: '0.825rem', color: '#5C4033', fontFamily: 'var(--font-dm-sans)',
                    lineHeight: 1.5,
                  }}>
                    <span style={{ color: '#C9A87C', flexShrink: 0, marginTop: '0.1em' }}>—</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Differentiators ── */}
      <section style={{
        padding: '5rem 1.5rem',
        background: 'linear-gradient(168deg, #EDE4D8 0%, #E0D4C4 100%)',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{
            fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase',
            color: '#B8A99A', fontFamily: 'var(--font-dm-sans)',
            textAlign: 'center', marginBottom: '0.75rem',
          }}>
            why corner
          </p>
          <h2 className="font-serif" style={{
            fontSize: '1.85rem', fontWeight: 300, textAlign: 'center',
            marginBottom: '3rem', color: '#3B2A1A',
          }}>
            Not another POS add-on.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {DIFFERENTIATORS.map((d, i) => (
              <div key={d.label} style={{
                padding: '1.75rem 0',
                borderTop: i > 0 ? '1px solid rgba(59,42,26,0.12)' : undefined,
                display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem',
              }}>
                <p className="font-serif" style={{ fontSize: '1.05rem', fontWeight: 300, color: '#3B2A1A', marginBottom: '0.35rem' }}>
                  {d.label}
                </p>
                <p style={{ fontSize: '0.85rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)', lineHeight: 1.65 }}>
                  {d.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder ── */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '640px', margin: '0 auto' }}>
        <p style={{
          fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase',
          color: '#B8A99A', fontFamily: 'var(--font-dm-sans)',
          textAlign: 'center', marginBottom: '3rem',
        }}>
          the story
        </p>

        <div style={{
          borderLeft: '3px solid #C9A87C', paddingLeft: '1.75rem',
        }}>
          <p className="font-serif" style={{
            fontSize: '1.25rem', fontWeight: 300, fontStyle: 'italic',
            lineHeight: 1.55, color: '#3B2A1A', marginBottom: '1.5rem',
          }}>
            "Corner!" — the word you yell every time you round a sharp turn back into the kitchen.
          </p>
          <p style={{
            fontSize: '0.875rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)',
            lineHeight: 1.7, marginBottom: '1.25rem',
          }}>
            Kylie Marcisz is a UC Berkeley EECS student who has worked in restaurants since she was 15½. She loves the culture — the inside jokes, the controlled chaos, the people who pour everything into their food and their community.
          </p>
          <p style={{
            fontSize: '0.875rem', color: '#6B5744', fontFamily: 'var(--font-dm-sans)',
            lineHeight: 1.7, marginBottom: '1.25rem',
          }}>
            After countless shifts yelling "corner!" in increasingly ridiculous voices with her coworkers, the name felt right. So did the mission: eliminate the stress that comes with miscommunication around ordering, so the people who love restaurants can focus on the part that matters — serving as many people as possible.
          </p>
          <p style={{
            fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#B8A99A', fontFamily: 'var(--font-dm-sans)',
          }}>
            Kylie Marcisz — Founder, Corner
          </p>
        </div>
      </section>

      {/* ── Demo ── */}
      <section id="demo" style={{
        padding: '5rem 1.5rem 6rem',
        background: 'linear-gradient(168deg, #FAF8F4 0%, #EDE4D8 100%)',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '0.6rem', letterSpacing: '0.38em', textTransform: 'uppercase',
          color: '#B8A99A', fontFamily: 'var(--font-dm-sans)', marginBottom: '0.75rem',
        }}>
          demo · the cellar
        </p>
        <h2 className="font-serif" style={{
          fontSize: '1.7rem', fontWeight: 300, color: '#3B2A1A',
          marginBottom: '0.6rem',
        }}>
          Try it now — no sign-up.
        </h2>
        <p style={{
          fontSize: '0.85rem', color: '#B8A99A', fontFamily: 'var(--font-dm-sans)',
          marginBottom: '2.5rem',
        }}>
          The Cellar is a live demo restaurant. Walk in as any role.
        </p>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
          maxWidth: '268px', margin: '0 auto',
        }}>
          {[
            { href: '/cellar/staff', label: 'staff', style: { border: '1px solid #C9A87C', color: '#3B2A1A', background: 'transparent' } },
            { href: '/cellar/kitchen', label: 'kitchen', style: { background: '#3B2A1A', color: '#FAF8F4' } },
            { href: '/cellar/owner', label: 'owner', style: { border: '1px solid rgba(59,42,26,0.14)', color: '#B8A99A', background: 'transparent' } },
            { href: '/cellar/artisan', label: 'ask grace ✦', style: { background: '#C9A87C', color: '#3B2A1A' } },
          ].map(r => (
            <Link key={r.href} href={r.href} style={{
              display: 'block', textAlign: 'center',
              padding: '0.95rem 1.5rem',
              fontSize: '0.65rem', letterSpacing: '0.32em', textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-sans)',
              ...r.style,
            }}>
              {r.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #EDE4D8', padding: '2rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <span className="font-serif" style={{ fontSize: '0.85rem', letterSpacing: '0.4em', paddingLeft: '0.4em', color: '#B8A99A' }}>
          corner
        </span>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link href="/setup" style={{
            fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#B8A99A', fontFamily: 'var(--font-dm-sans)',
          }}>
            set up your restaurant
          </Link>
          <Link href="/cellar/admin" style={{
            fontSize: '0.58rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#000', fontFamily: 'var(--font-dm-sans)',
          }}>
            admin
          </Link>
        </div>
      </footer>

    </main>
  )
}
