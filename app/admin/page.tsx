'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category, Item, AIPersona } from '@/lib/supabase'
import Link from 'next/link'

type ItemWithCategory = Item & { category: Category }

const THEMES = ['stone', 'amber', 'green', 'blue', 'rose', 'purple'] as const
type Theme = typeof THEMES[number]

const THEME_LABELS: Record<Theme, { label: string; preview: string }> = {
  stone:  { label: 'Dark',   preview: 'bg-stone-800' },
  amber:  { label: 'Amber',  preview: 'bg-amber-500' },
  green:  { label: 'Green',  preview: 'bg-green-600' },
  blue:   { label: 'Blue',   preview: 'bg-blue-600'  },
  rose:   { label: 'Rose',   preview: 'bg-rose-500'  },
  purple: { label: 'Purple', preview: 'bg-purple-600'},
}

const THEME_ACTIVE: Record<string, string> = {
  stone:  'bg-stone-800 text-white',
  amber:  'bg-amber-500 text-white',
  green:  'bg-green-600 text-white',
  blue:   'bg-blue-600 text-white',
  rose:   'bg-rose-500 text-white',
  purple: 'bg-purple-600 text-white',
}

export default function AdminPage() {
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

  // Persona form state
  const [pName, setPName] = useState('')
  const [pTitle, setPTitle] = useState('')
  const [pEmoji, setPEmoji] = useState('🤖')
  const [pTheme, setPTheme] = useState<Theme>('stone')
  const [pPrompt, setPPrompt] = useState('')
  const [pQuickPrompts, setPQuickPrompts] = useState('')
  const [editingPersona, setEditingPersona] = useState<AIPersona | null>(null)
  const [showPersonaForm, setShowPersonaForm] = useState(false)
  const [personaError, setPersonaError] = useState<string | null>(null)
  const [personaSaving, setPersonaSaving] = useState(false)

  const SHOP_ID = '00000000-0000-0000-0000-000000000001'

  useEffect(() => { loadData(); loadPersonas() }, [])

  async function loadData() {
    const { data: cats } = await supabase.from('categories').select('*').order('sort_order')
    const { data: its } = await supabase.from('items').select('*, category:categories(*)').eq('is_active', true)

    if (cats) {
      setCategories(cats)
      if (cats.length > 0 && !newItemCat) setNewItemCat(cats[0].id)
    }
    if (its) setItems(its as ItemWithCategory[])
    setLoading(false)
  }

  async function loadPersonas() {
    const { data: ps } = await supabase
      .from('ai_personas').select('*')
      .eq('shop_id', SHOP_ID).eq('is_active', true).order('sort_order')
    if (ps) setPersonas(ps as AIPersona[])
  }

  async function addCategory() {
    if (!newCatName.trim()) return
    const maxOrder = categories.reduce((m, c: any) => Math.max(m, c.sort_order || 0), 0)
    await supabase.from('categories').insert({
      shop_id: SHOP_ID,
      name: newCatName.trim(),
      sort_order: maxOrder + 1,
    })
    setNewCatName('')
    loadData()
  }

  async function addItem() {
    if (!newItemName.trim() || !newItemCat) return
    const { error } = await supabase.from('items').insert({
      category_id: newItemCat,
      name: newItemName.trim(),
      typical_supplier: newItemSupplier.trim() || null,
      can_order: newItemCanOrder,
      can_make: newItemCanMake,
      is_weekly: newItemIsWeekly,
    })
    if (error) { alert(error.message); return }
    setNewItemName('')
    setNewItemSupplier('')
    loadData()
  }

  async function deleteCategory(categoryId: string) {
    await supabase.from('categories').delete().eq('id', categoryId)
    setCategories(prev => prev.filter(c => c.id !== categoryId))
    setItems(prev => prev.filter(i => i.category_id !== categoryId))
  }

  async function deactivateItem(itemId: string) {
    await supabase.from('items').update({ is_active: false }).eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  function startEditPersona(persona: AIPersona) {
    setEditingPersona(persona)
    setPName(persona.name)
    setPTitle(persona.title)
    setPEmoji(persona.emoji)
    setPTheme(persona.theme as Theme)
    setPPrompt(persona.system_prompt)
    setPQuickPrompts(persona.quick_prompts.join('\n'))
    setShowPersonaForm(true)
  }

  function resetPersonaForm() {
    setEditingPersona(null)
    setPName('')
    setPTitle('')
    setPEmoji('🤖')
    setPTheme('stone')
    setPPrompt('')
    setPQuickPrompts('')
    setShowPersonaForm(false)
    setPersonaError(null)
  }

  async function savePersona() {
    setPersonaError(null)
    if (!pName.trim()) { setPersonaError('Name is required'); return }
    if (!pTitle.trim()) { setPersonaError('Title is required'); return }
    if (!pPrompt.trim()) { setPersonaError('System prompt is required'); return }

    setPersonaSaving(true)
    const quick = pQuickPrompts
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

    let error
    if (editingPersona) {
      const res = await supabase.from('ai_personas').update({
        name: pName.trim(),
        title: pTitle.trim(),
        emoji: pEmoji.trim() || '🤖',
        theme: pTheme,
        system_prompt: pPrompt.trim(),
        quick_prompts: quick,
      }).eq('id', editingPersona.id)
      error = res.error
    } else {
      const maxOrder = personas.reduce((m, p) => Math.max(m, p.sort_order || 0), 0)
      const res = await supabase.from('ai_personas').insert({
        shop_id: SHOP_ID,
        name: pName.trim(),
        title: pTitle.trim(),
        emoji: pEmoji.trim() || '🤖',
        theme: pTheme,
        system_prompt: pPrompt.trim(),
        quick_prompts: quick,
        sort_order: maxOrder + 1,
      })
      error = res.error
    }

    setPersonaSaving(false)
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        setPersonaError('Table not found — run the ai_personas SQL in Supabase first (see lib/supabase-schema.sql)')
      } else {
        setPersonaError(error.message)
      }
      return
    }
    resetPersonaForm()
    loadPersonas()
  }

  async function deletePersona(id: string) {
    await supabase.from('ai_personas').update({ is_active: false }).eq('id', id)
    setPersonas(prev => prev.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <p className="text-stone-400">Loading...</p>
      </main>
    )
  }

  const itemsByCategory = categories.map(cat => ({
    category: cat,
    items: items.filter(i => i.category_id === cat.id),
  }))

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>
      <div className="sticky top-0 backdrop-blur border-b px-4 py-4 flex items-center justify-between z-10"
        style={{ background: 'rgba(247,241,232,0.95)', borderColor: 'var(--cream-dark)' }}>
        <h1 className="font-display italic text-xl font-bold" style={{ color: 'var(--text)' }}>Admin Setup</h1>
        <Link href="/" className="text-sm" style={{ color: 'var(--muted)' }}>← Home</Link>
      </div>

      <div className="px-4 pt-6 space-y-8">
        {/* Add Category */}
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Add Category
          </h2>
          <div className="flex gap-2">
            <input
              className="flex-1 border-2 border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-stone-800"
              placeholder="e.g. Coffee, Cheese, Supplies"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
            />
            <button
              onClick={addCategory}
              className="bg-stone-800 text-white px-5 rounded-xl font-medium"
            >
              Add
            </button>
          </div>
        </section>

        {/* Add Item */}
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Add Item
          </h2>
          <div className="space-y-2">
            <select
              className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-stone-800 bg-white"
              value={newItemCat}
              onChange={e => setNewItemCat(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <input
              className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-stone-800"
              placeholder="Item name (e.g. Oat Milk)"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />
            <input
              className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:border-stone-800"
              placeholder="Supplier (optional)"
              value={newItemSupplier}
              onChange={e => setNewItemSupplier(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewItemCanOrder(v => !v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  newItemCanOrder
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'border-stone-200 text-stone-400'
                }`}
              >
                Can Order
              </button>
              <button
                type="button"
                onClick={() => setNewItemCanMake(v => !v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  newItemCanMake
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'border-stone-200 text-stone-400'
                }`}
              >
                Can Make
              </button>
              <button
                type="button"
                onClick={() => setNewItemIsWeekly(v => !v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                  newItemIsWeekly
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-stone-200 text-stone-400'
                }`}
              >
                Weekly
              </button>
            </div>
            <button
              onClick={addItem}
              className="w-full bg-stone-800 text-white py-3 rounded-xl font-medium"
            >
              Add Item
            </button>
          </div>
        </section>

        {/* AI Personas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
              AI Personas
            </h2>
            {!showPersonaForm && (
              <button
                onClick={() => setShowPersonaForm(true)}
                className="text-xs text-stone-500 border border-stone-300 rounded-lg px-3 py-1 hover:border-stone-500"
              >
                + Add Persona
              </button>
            )}
          </div>

          {/* Existing personas */}
          <div className="space-y-2 mb-4">
            {personas.map(persona => (
              <div key={persona.id} className="bg-white rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{persona.emoji}</span>
                    <div>
                      <p className="text-stone-800 font-medium">{persona.name}</p>
                      <p className="text-stone-400 text-xs">{persona.title}</p>
                    </div>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${THEME_ACTIVE[persona.theme] || 'bg-stone-200 text-stone-600'}`}>
                      {THEME_LABELS[persona.theme as Theme]?.label || persona.theme}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditPersona(persona)}
                      className="text-xs text-stone-400 hover:text-stone-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePersona(persona.id)}
                      className="text-xs text-red-300 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {persona.quick_prompts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {persona.quick_prompts.map((q, i) => (
                      <span key={i} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                        {q.length > 30 ? q.slice(0, 30) + '…' : q}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {personas.length === 0 && !showPersonaForm && (
              <p className="text-sm text-stone-300 pl-2">No AI personas yet</p>
            )}
          </div>

          {/* Add / Edit persona form */}
          {showPersonaForm && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 space-y-3">
              <p className="text-sm font-semibold text-stone-700">
                {editingPersona ? `Edit ${editingPersona.name}` : 'New Persona'}
              </p>

              <div className="flex gap-2">
                <input
                  className="w-16 border-2 border-stone-200 rounded-xl px-3 py-2.5 text-center text-xl focus:outline-none focus:border-stone-800"
                  placeholder="🤖"
                  value={pEmoji}
                  onChange={e => setPEmoji(e.target.value)}
                  maxLength={2}
                />
                <input
                  className="flex-1 border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-stone-800"
                  placeholder="Name (e.g. Alex)"
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                />
              </div>

              <input
                className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-stone-800"
                placeholder="Title (e.g. Specialty Barista)"
                value={pTitle}
                onChange={e => setPTitle(e.target.value)}
              />

              {/* Theme picker */}
              <div>
                <p className="text-xs text-stone-400 mb-2">Color theme</p>
                <div className="flex gap-2 flex-wrap">
                  {THEMES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPTheme(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-colors ${
                        pTheme === t ? 'border-stone-800' : 'border-stone-200'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${THEME_LABELS[t].preview}`} />
                      {THEME_LABELS[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-stone-400 mb-1">System prompt — tell the AI who it is and what it knows</p>
                <textarea
                  className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-800 resize-none"
                  placeholder="You are an expert in..."
                  rows={5}
                  value={pPrompt}
                  onChange={e => setPPrompt(e.target.value)}
                />
              </div>

              <div>
                <p className="text-xs text-stone-400 mb-1">Quick prompts — one per line (shown as suggestions to staff)</p>
                <textarea
                  className="w-full border-2 border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-800 resize-none"
                  placeholder={"What's trending right now?\nSuggest a seasonal special"}
                  rows={4}
                  value={pQuickPrompts}
                  onChange={e => setPQuickPrompts(e.target.value)}
                />
              </div>

              {personaError && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {personaError}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={savePersona}
                  disabled={personaSaving}
                  className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  {personaSaving ? 'Saving...' : editingPersona ? 'Save Changes' : 'Add Persona'}
                </button>
                <button
                  onClick={resetPersonaForm}
                  className="px-5 border-2 border-stone-200 rounded-xl text-stone-500 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Current Inventory */}
        <section>
          <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
            Current Inventory
          </h2>
          {itemsByCategory.map(({ category, items: catItems }) => (
            <div key={category.id} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-stone-600">{category.name}</p>
                {catItems.length === 0 && (
                  <button
                    onClick={() => deleteCategory(category.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
              {catItems.length === 0 && (
                <p className="text-sm text-stone-300 pl-2">No items yet</p>
              )}
              {catItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 mb-1 shadow-sm">
                  <div>
                    <p className="text-stone-700">{item.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      {item.can_order && (
                        <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">order</span>
                      )}
                      {item.can_make && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">make</span>
                      )}
                      {item.is_weekly && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">weekly</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deactivateItem(item.id)}
                    className="text-stone-300 hover:text-red-400 text-lg px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
