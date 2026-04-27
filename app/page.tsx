import Link from 'next/link'

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(168deg, #FAF8F4 0%, #EDE4D8 100%)' }}
    >
      {/* Wordmark */}
      <header className="text-center" style={{ paddingTop: '3.5rem' }}>
        <span
          className="font-serif"
          style={{
            fontSize: '1.15rem',
            letterSpacing: '0.55em',
            paddingLeft: '0.55em',
            color: '#3B2A1A',
          }}
        >
          corner
        </span>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ paddingBottom: '2rem' }}>
        <p
          className="font-serif"
          style={{
            fontSize: '0.72rem',
            letterSpacing: '0.32em',
            color: '#B8A99A',
            textTransform: 'uppercase',
            marginBottom: '1.75rem',
          }}
        >
          restaurant intelligence
        </p>

        <h1
          className="font-serif"
          style={{
            fontSize: '2.75rem',
            fontWeight: 300,
            lineHeight: 1.22,
            color: '#3B2A1A',
            letterSpacing: '0.01em',
            marginBottom: '0.5rem',
          }}
        >
          for the spaces
        </h1>
        <h1
          className="font-serif"
          style={{
            fontSize: '2.75rem',
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 1.22,
            color: '#3B2A1A',
            letterSpacing: '0.01em',
            marginBottom: '3rem',
          }}
        >
          that know themselves.
        </h1>

        {/* Gold rule */}
        <div
          style={{
            width: '3rem',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #C9A87C, transparent)',
            marginBottom: '3.25rem',
          }}
        />

        {/* Demo tenant label */}
        <p
          style={{
            fontSize: '0.62rem',
            letterSpacing: '0.32em',
            color: '#B8A99A',
            textTransform: 'uppercase',
            marginBottom: '1.4rem',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          demo · the cellar
        </p>

        {/* Role entry points */}
        <div
          style={{
            width: '100%',
            maxWidth: '268px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <Link
            href="/staff"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.95rem 1.5rem',
              border: '1px solid #C9A87C',
              color: '#3B2A1A',
              background: 'transparent',
              fontSize: '0.65rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-sans)',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            staff
          </Link>

          <Link
            href="/kitchen"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.95rem 1.5rem',
              background: '#3B2A1A',
              color: '#FAF8F4',
              fontSize: '0.65rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            kitchen
          </Link>

          <Link
            href="/owner"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.95rem 1.5rem',
              border: '1px solid rgba(59,42,26,0.14)',
              color: '#B8A99A',
              background: 'transparent',
              fontSize: '0.65rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            owner
          </Link>

          <Link
            href="/artisan"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.95rem 1.5rem',
              background: '#C9A87C',
              color: '#3B2A1A',
              fontSize: '0.65rem',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            ask grace ✦
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center" style={{ paddingBottom: '2.5rem' }}>
        <Link
          href="/admin"
          style={{
            fontSize: '0.58rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'rgba(184,169,154,0.35)',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          admin
        </Link>
      </footer>
    </main>
  )
}
