import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{
      backgroundImage: 'url(/wood-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Dark overlay over entire page */}
      <div className="flex-1 flex flex-col" style={{ background: 'rgba(18,6,10,0.65)' }}>
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-10">
          {/* Logo */}
          <div className="mb-10">
            <Image
              src="/cellar-logo.svg"
              alt="The Cellar"
              width={220}
              height={115}
              priority
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.92 }}
            />
          </div>

          <p className="font-label text-sm tracking-[0.25em] uppercase mb-10" style={{ color: 'rgba(247,241,232,0.45)' }}>
            Wine · Music · Great Food · Coffee
          </p>

          <div className="w-full max-w-xs flex flex-col gap-3">
            <Link
              href="/staff"
              className="font-label text-center py-4 rounded-2xl text-xl tracking-widest active:scale-95 transition-transform"
              style={{ background: 'var(--cream)', color: 'var(--wine-dark)' }}
            >
              I&apos;m Staff
            </Link>
            <Link
              href="/kitchen"
              className="font-label text-center py-4 rounded-2xl text-xl tracking-widest active:scale-95 transition-transform"
              style={{ background: 'var(--wine)', color: 'var(--cream)' }}
            >
              Kitchen Queue
            </Link>
            <Link
              href="/owner"
              className="font-label text-center py-4 rounded-2xl text-xl tracking-widest active:scale-95 transition-transform border"
              style={{ borderColor: 'rgba(247,241,232,0.2)', color: 'rgba(247,241,232,0.5)', background: 'transparent' }}
            >
              I&apos;m the Owner
            </Link>
            <Link
              href="/artisan"
              className="font-label text-center py-4 rounded-2xl text-xl tracking-widest active:scale-95 transition-transform"
              style={{ background: 'var(--gold)', color: 'var(--wine-dark)' }}
            >
              ✨ Ask Grace
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <Link
            href="/admin"
            className="text-xs tracking-widest uppercase"
            style={{ color: 'rgba(247,241,232,0.18)' }}
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}
