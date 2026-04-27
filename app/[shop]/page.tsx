'use client'

import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ShopLandingPage() {
  const { shop, loading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()

  if (notFound) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center" style={{ background: 'var(--cream)' }}>
        <p className="font-serif mb-2" style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--text)' }}>
          Shop not found.
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
          No restaurant with that name is on Corner yet.
        </p>
        <Link href="/setup" style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)', textDecoration: 'underline' }}>
          Create one →
        </Link>
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>a moment...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(168deg, #FAF8F4 0%, #EDE4D8 100%)' }}>
      <header className="text-center" style={{ paddingTop: '3.5rem' }}>
        <span style={{ fontSize: '0.62rem', letterSpacing: '0.5em', paddingLeft: '0.5em', color: 'var(--muted)', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)' }}>
          corner
        </span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-8" style={{ paddingBottom: '2rem' }}>
        <h1 className="font-serif" style={{ fontSize: '2.6rem', fontWeight: 300, color: 'var(--text)', lineHeight: 1.2, marginBottom: shop?.tagline ? '0.75rem' : '2.5rem' }}>
          {shop?.name}
        </h1>

        {shop?.tagline && (
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.25em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '2.5rem', fontFamily: 'var(--font-dm-sans)' }}>
            {shop.tagline}
          </p>
        )}

        <div style={{ width: '3rem', height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', marginBottom: '2.5rem' }} />

        <div style={{ width: '100%', maxWidth: '268px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link href={`/${slug}/staff`} style={{ display: 'block', textAlign: 'center', padding: '0.95rem 1.5rem', border: '1px solid var(--gold)', color: 'var(--text)', background: 'transparent', fontSize: '0.65rem', letterSpacing: '0.32em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)' }}>
            staff
          </Link>
          <Link href={`/${slug}/kitchen`} style={{ display: 'block', textAlign: 'center', padding: '0.95rem 1.5rem', background: 'var(--text)', color: 'var(--cream)', fontSize: '0.65rem', letterSpacing: '0.32em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)' }}>
            kitchen
          </Link>
          <Link href={`/${slug}/owner`} style={{ display: 'block', textAlign: 'center', padding: '0.95rem 1.5rem', border: '1px solid rgba(59,42,26,0.14)', color: 'var(--muted)', background: 'transparent', fontSize: '0.65rem', letterSpacing: '0.32em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)' }}>
            owner
          </Link>
          <Link href={`/${slug}/artisan`} style={{ display: 'block', textAlign: 'center', padding: '0.95rem 1.5rem', background: 'var(--gold)', color: 'var(--text)', fontSize: '0.65rem', letterSpacing: '0.32em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-sans)' }}>
            ask grace ✦
          </Link>
        </div>
      </div>

      <footer className="text-center" style={{ paddingBottom: '2.5rem' }}>
        <Link href={`/${slug}/admin`} style={{ fontSize: '0.58rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(184,169,154,0.35)', fontFamily: 'var(--font-dm-sans)' }}>
          admin
        </Link>
      </footer>
    </main>
  )
}
