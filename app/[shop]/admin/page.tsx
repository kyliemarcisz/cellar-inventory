'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import type { Category, Item, AIPersona } from '@/lib/supabase'
import Link from 'next/link'

type ItemWithCategory = Item & { category: Category }
const THEMES = ['stone', 'amber', 'green', 'blue', 'rose', 'purple'] as const
type Theme = typeof THEMES[number]
const THEME_LABELS: Record<Theme, string> = { stone: 'Dark', amber: 'Amber', green: 'Green', blue: 'Blue', rose: 'Rose', purple: 'Purple' }

export default function AdminPage() {
  const { shopId, catIds, loading: shopLoading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()

  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ItemWithCategory[]>([])
  const [personas, setPersonas] = useState<AIPersona[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemCat, setNewItemCat] = useState('')
  const [newItemSupplier, setNewItemSupplier] = useState('')
  const [newItemCanOrder, setNewItemCanOrder] = useState(true)
  const [newItemCanMake, setNewItemCanMake] = useState(false)
  const [newItemIsWeekly, setNewItemIsWeekly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pName, setPName] = useState(''); const [pTitle, setPTitle] = useState(''); const [pEmoji, setPEmoji] = useState('🤖')
  const [pTheme, setPTheme] = useState<Theme>('stone'); const [pPrompt, setPPrompt] = useState(''); const [pQuickPrompts, setPQuickPrompts] = useState('')
  const [editingPersona, setEditingPersona] = useState<AIPersona | null>(null)
  const [showPersonaForm, setShowPersonaForm] = useState(false)
  const [personaError, setPersonaError] = useState<string | null>(null)
  const [personaSaving, setPersonaSaving] = useState(false)

  useEffect(() => {
    if (!shopLoading && shopId) { loadData(); loadPersonas() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopLoading, shopId])

  async function loadData() {
    if (!shopId) return
    const { data: cats } = await supabase.from('categories').select('*').eq('shop_id', shopId).order('sort_order')
    if (cats) { setCategories(cats); if (cats.length > 0 && !newItemCat) setNewItemCat(cats[0].id) }
    if (catIds.length > 0) {
      const { data: its } = await supabase.from('items').select('*, category:categories(*)').in('category_id', catIds).eq('is_active', true)
      if (its) setItems(its as ItemWithCategory[])
    }
    setLoading(false)
  }

  async function loadPersonas() {
    if (!shopId) return
    const { data: ps } = await supabase.from('ai_personas').select('*').eq('shop_id', shopId).eq('is_active', true).order('sort_order')
    if (ps) setPersonas(ps as AIPersona[])
  }

  async function addCategory() {
    if (!newCatName.trim() || !shopId) return
    const maxOrder = categories.reduce((m, c: any) => Math.max(m, c.sort_order || 0), 0)
    await supabase.from('categories').insert({ shop_id: shopId, name: newCatName.trim(), sort_order: maxOrder + 1 })
    setNewCatName(''); loadData()
  }

  async function addItem() {
    if (!newItemName.trim() || !newItemCat) return
    const { error } = await supabase.from('items').insert({ category_id: newItemCat, name: newItemName.trim(), typical_supplier: newItemSupplier.trim() || null, can_order: newItemCanOrder, can_make: newItemCanMake, is_weekly: newItemIsWeekly })
    if (error) { alert(error.message); return }
    setNewItemName(''); setNewItemSupplier(''); loadData()
  }

  async function deleteCategory(id: string) {
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
    setItems(prev => prev.filter(i => i.category_id !== id))
  }

  async function deactivateItem(id: string) {
    await supabase.from('items').update({ is_active: false }).eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function startEditPersona(p: AIPersona) { setEditingPersona(p); setPName(p.name); setPTitle(p.title); setPEmoji(p.emoji); setPTheme(p.theme as Theme); setPPrompt(p.system_prompt); setPQuickPrompts(p.quick_prompts.join('\n')); setShowPersonaForm(true) }
  function resetPersonaForm() { setEditingPersona(null); setPName(''); setPTitle(''); setPEmoji('🤖'); setPTheme('stone'); setPPrompt(''); setPQuickPrompts(''); setShowPersonaForm(false); setPersonaError(null) }

  async function savePersona() {
    setPersonaError(null)
    if (!pName.trim()) { setPersonaError('Name is required'); return }
    if (!pTitle.trim()) { setPersonaError('Title is required'); return }
    if (!pPrompt.trim()) { setPersonaError('System prompt is required'); return }
    setPersonaSaving(true)
    const quick = pQuickPrompts.split('\n').map(l => l.trim()).filter(Boolean)
    let error
    if (editingPersona) {
      const res = await supabase.from('ai_personas').update({ name: pName.trim(), title: pTitle.trim(), emoji: pEmoji.trim() || '🤖', theme: pTheme, system_prompt: pPrompt.trim(), quick_prompts: quick }).eq('id', editingPersona.id)
      error = res.error
    } else {
      const maxOrder = personas.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)
      const res = await supabase.from('ai_personas').insert({ shop_id: shopId, name: pName.trim(), title: pTitle.trim(), emoji: pEmoji.trim() || '🤖', theme: pTheme, system_prompt: pPrompt.trim(), quick_prompts: quick, sort_order: maxOrder + 1 })
      error = res.error
    }
    setPersonaSaving(false)
    if (error) { setPersonaError(error.message); return }
    resetPersonaForm(); loadPersonas()
  }

  async function deletePersona(id: string) {
    await supabase.from('ai_personas').update({ is_active: false }).eq('id', id)
    setPersonas(prev => prev.filter(p => p.id !== id))
  }

  if (notFound) return <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}><p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Shop not found.</p></main>
  if (shopLoading || loading) return <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}><p className="font-serif" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>a moment...</p></main>

  const itemsByCategory = categories.map(cat => ({ category: cat, items: items.filter(i => i.category_id === cat.id) }))

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>
      <div className="sticky top-0 backdrop-blur border-b px-4 py-4 flex items-center justify-between z-10" style={{ background: 'rgba(245,239,224,0.96)', borderColor: 'var(--cream-dark)' }}>
        <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)' }}>Admin Setup</h1>
        <Link href={`/${slug}`} className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>← Home</Link>
      </div>

      <div className="px-4 pt-6 space-y-8">
        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Add Category</p>
          <div className="flex gap-2">
            <input className="flex-1 px-4 py-3 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }} placeholder="e.g. Coffee, Cheese, Supplies" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
            <button onClick={addCategory} className="px-5 text-sm" style={{ background: 'var(--wine-dark)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>Add</button>
          </div>
        </section>

        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Add Item</p>
          <div className="space-y-2">
            <select className="w-full px-4 py-3 focus:outline-none bg-white" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', color: 'var(--text)' }} value={newItemCat} onChange={e => setNewItemCat(e.target.value)}>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <input className="w-full px-4 py-3 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }} placeholder="Item name" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
            <input className="w-full px-4 py-3 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }} placeholder="Supplier (optional)" value={newItemSupplier} onChange={e => setNewItemSupplier(e.target.value)} />
            <div className="flex gap-2">
              {[['Can Order', newItemCanOrder, () => setNewItemCanOrder(v => !v)], ['Can Make', newItemCanMake, () => setNewItemCanMake(v => !v)], ['Weekly', newItemIsWeekly, () => setNewItemIsWeekly(v => !v)]].map(([label, active, toggle]) => (
                <button key={label as string} type="button" onClick={toggle as () => void} className="flex-1 py-2.5 text-xs uppercase tracking-widest transition-colors"
                  style={active ? { background: 'var(--wine-dark)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', border: '1px solid var(--wine-dark)' } : { border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>
                  {label as string}
                </button>
              ))}
            </div>
            <button onClick={addItem} className="w-full py-3 text-xs uppercase tracking-widest" style={{ background: 'var(--wine-dark)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }}>Add Item</button>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>AI Personas</p>
            {!showPersonaForm && <button onClick={() => setShowPersonaForm(true)} className="text-xs px-3 py-1.5 uppercase tracking-widest" style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.15em' }}>+ Add</button>}
          </div>
          <div className="space-y-2 mb-4">
            {personas.map(p => (
              <div key={p.id} className="px-4 py-3" style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <div><p style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem' }}>{p.name}</p><p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-dm-sans)' }}>{p.title}</p></div>
                    <span className="text-xs px-2 py-0.5 ml-2" style={{ background: 'var(--cream-dark)', color: 'var(--muted)', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem' }}>{THEME_LABELS[p.theme as Theme] || p.theme}</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => startEditPersona(p)} className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Edit</button>
                    <button onClick={() => deletePersona(p.id)} className="text-xs" style={{ color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)' }}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
            {personas.length === 0 && !showPersonaForm && <p className="text-sm pl-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>No personas yet</p>}
          </div>

          {showPersonaForm && (
            <div className="p-4 space-y-3" style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}>
              <p className="text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>{editingPersona ? `Edit ${editingPersona.name}` : 'New Persona'}</p>
              <div className="flex gap-2">
                <input className="px-3 py-2.5 text-center text-xl focus:outline-none" style={{ width: '64px', border: '1px solid var(--cream-dark)', borderRadius: '4px' }} placeholder="🤖" value={pEmoji} onChange={e => setPEmoji(e.target.value)} maxLength={2} />
                <input className="flex-1 px-4 py-2.5 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }} placeholder="Name" value={pName} onChange={e => setPName(e.target.value)} />
              </div>
              <input className="w-full px-4 py-2.5 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }} placeholder="Title" value={pTitle} onChange={e => setPTitle(e.target.value)} />
              <div className="flex gap-1.5 flex-wrap">
                {THEMES.map(t => <button key={t} type="button" onClick={() => setPTheme(t)} className="px-3 py-1.5 text-xs border-2 transition-colors" style={{ borderColor: pTheme === t ? 'var(--wine-dark)' : 'var(--cream-dark)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', color: 'var(--text)' }}>{THEME_LABELS[t]}</button>)}
              </div>
              <textarea className="w-full px-4 py-3 text-sm focus:outline-none resize-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }} placeholder="System prompt — tell the AI who it is" rows={5} value={pPrompt} onChange={e => setPPrompt(e.target.value)} />
              <textarea className="w-full px-4 py-3 text-sm focus:outline-none resize-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }} placeholder={"Quick prompts — one per line"} rows={3} value={pQuickPrompts} onChange={e => setPQuickPrompts(e.target.value)} />
              {personaError && <p className="text-sm px-4 py-3" style={{ background: 'rgba(193,113,79,0.08)', color: 'var(--terra)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>{personaError}</p>}
              <div className="flex gap-2">
                <button onClick={savePersona} disabled={personaSaving} className="flex-1 py-3 text-xs uppercase tracking-widest disabled:opacity-50" style={{ background: 'var(--wine-dark)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }}>{personaSaving ? 'Saving...' : editingPersona ? 'Save Changes' : 'Add Persona'}</button>
                <button onClick={resetPersonaForm} className="px-5 text-xs uppercase tracking-widest" style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>Cancel</button>
              </div>
            </div>
          )}
        </section>

        <section>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Current Inventory</p>
          {itemsByCategory.map(({ category, items: catItems }) => (
            <div key={category.id} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>{category.name}</p>
                {catItems.length === 0 && <button onClick={() => deleteCategory(category.id)} className="text-xs" style={{ color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)' }}>Delete</button>}
              </div>
              {catItems.map(item => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2 mb-1" style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}>
                  <div>
                    <p style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem' }}>{item.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      {item.can_order && <span className="text-xs px-2 py-0.5" style={{ background: 'var(--cream-dark)', color: 'var(--muted)', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)' }}>order</span>}
                      {item.can_make && <span className="text-xs px-2 py-0.5" style={{ background: 'rgba(196,168,130,0.2)', color: '#7A5A30', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)' }}>make</span>}
                      {item.is_weekly && <span className="text-xs px-2 py-0.5" style={{ background: 'rgba(138,145,103,0.15)', color: 'var(--muted)', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)' }}>weekly</span>}
                    </div>
                  </div>
                  <button onClick={() => deactivateItem(item.id)} style={{ color: 'var(--muted)', fontSize: '1.25rem', padding: '0 0.5rem' }}>×</button>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
