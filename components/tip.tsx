'use client'
import { useState, useRef, useEffect } from 'react'

export function Tip({ text, dark }: { text: string; dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      <span
        onClick={e => { e.stopPropagation(); setOpen(p => !p) }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '14px', height: '14px', borderRadius: '50%',
          border: `1px solid ${dark ? 'rgba(196,168,130,0.5)' : 'rgba(154,136,120,0.5)'}`,
          fontSize: '9px', cursor: 'pointer',
          color: dark ? 'rgba(196,168,130,0.7)' : 'var(--muted)',
          marginLeft: '5px', flexShrink: 0,
          userSelect: 'none', lineHeight: 1,
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        i
      </span>
      {open && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 7px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#3B2A1A', color: '#FAF8F4',
          padding: '8px 12px', borderRadius: '4px',
          fontSize: '0.72rem', fontFamily: 'var(--font-dm-sans)',
          whiteSpace: 'normal', zIndex: 300,
          width: '190px', lineHeight: 1.55,
          pointerEvents: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        }}>
          {text}
          <span style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            border: '5px solid transparent',
            borderTopColor: '#3B2A1A',
          }} />
        </span>
      )}
    </span>
  )
}
