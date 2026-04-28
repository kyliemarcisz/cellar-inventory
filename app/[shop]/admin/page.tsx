'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useShop } from '@/lib/shop-context'
import { useParams } from 'next/navigation'
import type { Category, Item, AIPersona, ShopDocument } from '@/lib/supabase'
import Link from 'next/link'

type ItemWithCategory = Item & { category: Category }
type AdminTab = 'menu' | 'inventory' | 'personas'
const PERSONA_THEMES = ['stone', 'amber', 'green', 'blue', 'rose', 'purple'] as const
type PersonaTheme = typeof PERSONA_THEMES[number]
const THEME_LABELS: Record<PersonaTheme, string> = { stone: 'Dark', amber: 'Amber', green: 'Green', blue: 'Blue', rose: 'Rose', purple: 'Purple' }

type ParsedItem = { name: string; can_order: boolean; can_make: boolean; is_weekly: boolean; selected: boolean }
type ParsedCategory = { name: string; isNew: boolean; items: ParsedItem[] }

export default function AdminPage() {
  const { shop, shopId, catIds, loading: shopLoading, notFound } = useShop()
  const { shop: slug } = useParams<{ shop: string }>()

  const [tab, setTab] = useState<AdminTab>('menu')
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ItemWithCategory[]>([])
  const [personas, setPersonas] = useState<AIPersona[]>([])
  const [loading, setLoading] = useState(true)

  // Menu tab state
  const [menuInputMode, setMenuInputMode] = useState<'text' | 'pdf'>('text')
  const [menuText, setMenuText] = useState('')
  const [savedMenu, setSavedMenu] = useState('')
  const [menuFile, setMenuFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parseSummary, setParseSummary] = useState('')
  const [parsedCategories, setParsedCategories] = useState<ParsedCategory[]>([])
  const [adding, setAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  // Documents state
  const [documents, setDocuments] = useState<ShopDocument[]>([])
  const [docName, setDocName] = useState('')
  const [docContent, setDocContent] = useState('')
  const [docSaving, setDocSaving] = useState(false)

  // Inventory tab state
  const [newCatName, setNewCatName] = useState('')
  const [newItemName, setNewItemName] = useState('')
  const [newItemCat, setNewItemCat] = useState('')
  const [newItemSupplier, setNewItemSupplier] = useState('')
  const [newItemCanOrder, setNewItemCanOrder] = useState(true)
  const [newItemCanMake, setNewItemCanMake] = useState(false)
  const [newItemIsWeekly, setNewItemIsWeekly] = useState(false)
  const [editingSupplierCatId, setEditingSupplierCatId] = useState<string | null>(null)
  const [supplierNameInput, setSupplierNameInput] = useState('')
  const [supplierEmailInput, setSupplierEmailInput] = useState('')
  const [supplierSaving, setSupplierSaving] = useState(false)

  // Persona tab state
  const [pName, setPName] = useState(''); const [pTitle, setPTitle] = useState(''); const [pEmoji, setPEmoji] = useState('🤖')
  const [pTheme, setPTheme] = useState<PersonaTheme>('stone'); const [pPrompt, setPPrompt] = useState(''); const [pQuickPrompts, setPQuickPrompts] = useState('')
  const [editingPersona, setEditingPersona] = useState<AIPersona | null>(null)
  const [showPersonaForm, setShowPersonaForm] = useState(false)
  const [personaError, setPersonaError] = useState<string | null>(null)
  const [personaSaving, setPersonaSaving] = useState(false)
  const [generatingPrompt, setGeneratingPrompt] = useState(false)

  useEffect(() => {
    if (!shopLoading && shopId) { loadData(); loadPersonas(); loadMenu(); loadDocuments() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopLoading, shopId])

  async function loadMenu() {
    if (!shopId) return
    const { data } = await supabase.from('shops').select('menu_text').eq('id', shopId).single()
    if (data?.menu_text) { setSavedMenu(data.menu_text); setMenuText(data.menu_text) }
  }

  async function loadData() {
    if (!shopId) return
    const { data: cats } = await supabase.from('categories').select('*').eq('shop_id', shopId).order('sort_order')
    if (cats) { setCategories(cats); if (cats.length > 0 && !newItemCat) setNewItemCat(cats[0].id) }
    const freshCatIds = cats?.map(c => c.id) ?? []
    if (freshCatIds.length > 0) {
      const { data: its } = await supabase.from('items').select('*, category:categories(*)').in('category_id', freshCatIds).eq('is_active', true)
      if (its) setItems(its as ItemWithCategory[])
    }
    setLoading(false)
  }

  async function loadPersonas() {
    if (!shopId) return
    const { data: ps } = await supabase.from('ai_personas').select('*').eq('shop_id', shopId).eq('is_active', true).order('sort_order')
    if (ps) setPersonas(ps as AIPersona[])
  }

  // ── Menu actions ──

  async function loadDocuments() {
    if (!shopId) return
    const { data } = await supabase.from('shop_documents').select('*').eq('shop_id', shopId).order('created_at')
    if (data) setDocuments(data as ShopDocument[])
  }

  async function saveDocument() {
    if (!shopId || !docName.trim() || !docContent.trim()) return
    setDocSaving(true)
    const { data } = await supabase.from('shop_documents').insert({ shop_id: shopId, name: docName.trim(), content: docContent.trim() }).select('*').single()
    if (data) { setDocuments(prev => [...prev, data as ShopDocument]); setDocName(''); setDocContent('') }
    setDocSaving(false)
  }

  async function deleteDocument(id: string) {
    await supabase.from('shop_documents').delete().eq('id', id)
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  async function saveMenu() {
    if (!shopId || !menuText.trim()) return
    await supabase.from('shops').update({ menu_text: menuText.trim() }).eq('id', shopId)
    setSavedMenu(menuText.trim())
  }

  async function parseMenu() {
    if (menuInputMode === 'text' && !menuText.trim()) return
    if (menuInputMode === 'pdf' && !menuFile) return
    setParsing(true); setParseError(''); setParsedCategories([]); setParseSummary('')

    if (menuInputMode === 'text') await saveMenu()

    try {
      let body: Record<string, unknown> = {
        shopName: shop?.name || 'this restaurant',
        venueType: shop?.type || 'restaurant',
        existingCategories: categories.map(c => c.name),
      }

      if (menuInputMode === 'pdf' && menuFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve((e.target?.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(menuFile)
        })
        body = { ...body, pdfBase64: base64 }
      } else {
        body = { ...body, menuText: menuText.trim() }
      }

      const res = await fetch('/api/parse-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) { setParseError(data.error); return }

      const withSelected: ParsedCategory[] = (data.categories || []).map((cat: Omit<ParsedCategory, 'items'> & { items: Omit<ParsedItem, 'selected'>[] }) => ({
        ...cat,
        items: cat.items.map(item => ({ ...item, selected: true })),
      }))
      setParsedCategories(withSelected)
      setParseSummary(data.summary || '')
    } catch {
      setParseError('Something went wrong — try again.')
    } finally {
      setParsing(false)
    }
  }

  function toggleParsedItem(catIdx: number, itemIdx: number) {
    setParsedCategories(prev => prev.map((cat, ci) =>
      ci !== catIdx ? cat : { ...cat, items: cat.items.map((item, ii) => ii !== itemIdx ? item : { ...item, selected: !item.selected }) }
    ))
  }

  function toggleParsedCategory(catIdx: number, selected: boolean) {
    setParsedCategories(prev => prev.map((cat, ci) =>
      ci !== catIdx ? cat : { ...cat, items: cat.items.map(item => ({ ...item, selected })) }
    ))
  }

  async function addParsedItems() {
    if (!shopId) return
    setAdding(true)

    const existingCatMap: Record<string, string> = {}
    categories.forEach(c => { existingCatMap[c.name.toLowerCase()] = c.id })

    let maxOrder = categories.reduce((m, c: Category & { sort_order?: number }) => Math.max(m, (c as unknown as { sort_order: number }).sort_order || 0), 0)

    for (const parsedCat of parsedCategories) {
      const selectedItems = parsedCat.items.filter(i => i.selected)
      if (selectedItems.length === 0) continue

      let catId = existingCatMap[parsedCat.name.toLowerCase()]
      if (!catId) {
        maxOrder++
        const { data: newCat } = await supabase.from('categories').insert({ shop_id: shopId, name: parsedCat.name, sort_order: maxOrder }).select('id').single()
        if (newCat) catId = newCat.id
      }
      if (!catId) continue

      await supabase.from('items').insert(
        selectedItems.map(item => ({ category_id: catId, name: item.name, can_order: item.can_order, can_make: item.can_make, is_weekly: item.is_weekly }))
      )
    }

    setAdding(false)
    setAddSuccess(true)
    setParsedCategories([])
    setTimeout(() => setAddSuccess(false), 3000)
    loadData()
  }

  // ── Inventory actions ──

  async function addCategory() {
    if (!newCatName.trim() || !shopId) return
    const maxOrder = categories.reduce((m, c: Category & { sort_order?: number }) => Math.max(m, (c as unknown as { sort_order: number }).sort_order || 0), 0)
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

  function startEditSupplier(cat: Category) {
    setEditingSupplierCatId(cat.id)
    setSupplierNameInput(cat.supplier_name || '')
    setSupplierEmailInput(cat.supplier_email || '')
  }

  async function saveSupplier(catId: string) {
    setSupplierSaving(true)
    await supabase.from('categories').update({ supplier_name: supplierNameInput.trim() || null, supplier_email: supplierEmailInput.trim() || null }).eq('id', catId)
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, supplier_name: supplierNameInput.trim() || null, supplier_email: supplierEmailInput.trim() || null } : c))
    setEditingSupplierCatId(null)
    setSupplierSaving(false)
  }

  // ── Persona actions ──

  function startEditPersona(p: AIPersona) { setEditingPersona(p); setPName(p.name); setPTitle(p.title); setPEmoji(p.emoji); setPTheme(p.theme as PersonaTheme); setPPrompt(p.system_prompt); setPQuickPrompts(p.quick_prompts.join('\n')); setShowPersonaForm(true) }
  function resetPersonaForm() { setEditingPersona(null); setPName(''); setPTitle(''); setPEmoji('🤖'); setPTheme('stone'); setPPrompt(''); setPQuickPrompts(''); setShowPersonaForm(false); setPersonaError(null) }

  async function generatePrompt() {
    if (!pName.trim() || !pTitle.trim()) { setPersonaError('Enter a name and title first'); return }
    setGeneratingPrompt(true); setPersonaError(null)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'You write concise, professional AI persona system prompts for restaurant staff tools. Return only the system prompt text, no preamble.',
          message: `Write a system prompt for an AI assistant named "${pName}" (${pTitle}) at ${shop?.name || 'this restaurant'} (${shop?.type || 'restaurant'}). The persona should be knowledgeable, warm, and speak in the voice of a seasoned ${pTitle.toLowerCase()}. Keep it under 150 words.${savedMenu ? ` The restaurant's menu will be injected separately as context — reference that the persona has access to the current menu.` : ''}`,
        }),
      })
      const reader = res.body!.getReader(); const decoder = new TextDecoder()
      let result = ''; let done = false
      while (!done) { const { value, done: d } = await reader.read(); done = d; if (value) result += decoder.decode(value) }
      setPPrompt(result.trim())
    } catch { setPersonaError('Generation failed') }
    finally { setGeneratingPrompt(false) }
  }

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
  const totalParsedSelected = parsedCategories.reduce((sum, cat) => sum + cat.items.filter(i => i.selected).length, 0)

  const tabStyle = (t: AdminTab) => t === tab
    ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }
    : { color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--cream)' }}>
      <div className="sticky top-0 backdrop-blur border-b z-10" style={{ background: 'rgba(245,239,224,0.96)', borderColor: 'var(--cream-dark)' }}>
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: 300, color: 'var(--text)' }}>Admin</h1>
          <Link href={`/${slug}`} className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>← Home</Link>
        </div>
        <div className="flex gap-1 px-4 pb-3">
          {(['menu', 'inventory', 'personas'] as AdminTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} className="flex-1 py-2 text-xs uppercase tracking-widest capitalize transition-all" style={tabStyle(t)}>
              {t === 'menu' ? '✦ Menu & AI' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-6">

        {/* ── Menu Tab ── */}
        {tab === 'menu' && (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Menu & Drinks List</p>
              <p className="text-sm mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                Upload your menu — Corner reads it and builds your inventory automatically. Your AI personas will know every item on it.
              </p>

              {/* Mode toggle */}
              <div className="flex gap-1 p-1 mb-3" style={{ background: 'var(--cream-dark)', borderRadius: '4px' }}>
                {(['text', 'pdf'] as const).map(mode => (
                  <button key={mode} onClick={() => { setMenuInputMode(mode); setMenuFile(null); setParseError('') }}
                    className="flex-1 py-2 text-xs uppercase tracking-widest transition-all"
                    style={menuInputMode === mode
                      ? { background: 'var(--wine)', color: 'var(--cream)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }
                      : { color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }}>
                    {mode === 'text' ? 'Paste Text' : '↑ Upload PDF'}
                  </button>
                ))}
              </div>

              {menuInputMode === 'text' ? (
                <>
                  <textarea
                    className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                    style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', minHeight: '220px' }}
                    placeholder={"Paste your full menu here — food, wine list, cocktails, spirits, anything your team tracks.\n\nExample:\n\nRed Wine\nBarolo Castiglione 2019 — $18 / $68\nAmarone della Valpolicella 2017 — $22 / $84\n\nCocktails\nNegroni — Campari, sweet vermouth, gin — $16"}
                    value={menuText}
                    onChange={e => setMenuText(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveMenu} disabled={!menuText.trim() || menuText === savedMenu} className="px-4 py-2.5 text-xs uppercase tracking-widest disabled:opacity-40"
                      style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }}>
                      Save
                    </button>
                    <button onClick={parseMenu} disabled={parsing || !menuText.trim()} className="flex-1 py-2.5 text-xs uppercase tracking-widest disabled:opacity-40"
                      style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
                      {parsing ? 'Reading menu…' : '✦ Parse with AI →'}
                    </button>
                  </div>
                  {savedMenu && menuText === savedMenu && !parsedCategories.length && (
                    <p className="text-xs mt-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>✓ Menu saved — personas will use this as context.</p>
                  )}
                </>
              ) : (
                <>
                  <label className="block cursor-pointer" style={{ borderRadius: '4px' }}>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={e => { setMenuFile(e.target.files?.[0] ?? null); setParseError('') }}
                    />
                    <div className="flex flex-col items-center justify-center py-10 px-4"
                      style={{ background: 'white', border: `2px dashed ${menuFile ? 'var(--wine)' : 'var(--cream-dark)'}`, borderRadius: '4px', transition: 'border-color 0.15s' }}>
                      {menuFile ? (
                        <>
                          <p className="text-2xl mb-2">📄</p>
                          <p className="text-sm font-medium text-center" style={{ color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)' }}>{menuFile.name}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{(menuFile.size / 1024).toFixed(0)} KB · tap to change</p>
                        </>
                      ) : (
                        <>
                          <p className="text-3xl mb-2" style={{ opacity: 0.4 }}>↑</p>
                          <p className="text-sm text-center" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>Tap to select a PDF</p>
                          <p className="text-xs mt-1 text-center" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Your menu, drinks list, or price sheet</p>
                        </>
                      )}
                    </div>
                  </label>
                  <button onClick={parseMenu} disabled={parsing || !menuFile} className="w-full mt-2 py-2.5 text-xs uppercase tracking-widest disabled:opacity-40"
                    style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}>
                    {parsing ? 'Reading PDF…' : '✦ Parse with AI →'}
                  </button>
                </>
              )}

              {parseError && <p className="text-xs mt-2 px-3 py-2" style={{ background: 'rgba(193,113,79,0.08)', color: 'var(--terra)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>{parseError}</p>}
            </div>

            {/* Parse results */}
            {parsedCategories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>
                      AI Suggestions · {totalParsedSelected} items selected
                    </p>
                    {parseSummary && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{parseSummary}</p>}
                  </div>
                  <button onClick={addParsedItems} disabled={adding || totalParsedSelected === 0} className="px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
                    style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.62rem' }}>
                    {adding ? 'Adding…' : `Add ${totalParsedSelected}`}
                  </button>
                </div>

                <div className="space-y-4">
                  {parsedCategories.map((cat, ci) => {
                    const allSelected = cat.items.every(i => i.selected)
                    return (
                      <div key={ci} style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--cream-dark)', background: 'var(--cream-dark)' }}>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', fontSize: '0.65rem' }}>{cat.name}</p>
                            {cat.isNew && <span className="text-xs px-1.5 py-0.5" style={{ background: 'rgba(107,39,55,0.1)', color: 'var(--wine)', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.56rem', letterSpacing: '0.1em' }}>new</span>}
                          </div>
                          <button onClick={() => toggleParsedCategory(ci, !allSelected)} className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                            {allSelected ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        <div className="divide-y" style={{ borderColor: 'var(--cream-dark)' }}>
                          {cat.items.map((item, ii) => (
                            <button key={ii} onClick={() => toggleParsedItem(ci, ii)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left" style={{ opacity: item.selected ? 1 : 0.45 }}>
                              <span className="w-4 h-4 flex items-center justify-center flex-shrink-0" style={{ border: `1px solid ${item.selected ? 'var(--wine)' : 'var(--cream-dark)'}`, borderRadius: '2px', background: item.selected ? 'var(--wine)' : 'transparent' }}>
                                {item.selected && <span style={{ color: 'var(--cream)', fontSize: '9px' }}>✓</span>}
                              </span>
                              <span className="flex-1 text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>{item.name}</span>
                              <span className="flex gap-1">
                                {item.can_order && <span className="text-xs px-1.5 py-0.5" style={{ background: 'var(--cream-dark)', color: 'var(--muted)', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.56rem' }}>order</span>}
                                {item.can_make && <span className="text-xs px-1.5 py-0.5" style={{ background: 'rgba(196,168,130,0.2)', color: '#7A5A30', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.56rem' }}>make</span>}
                                {item.is_weekly && <span className="text-xs px-1.5 py-0.5" style={{ background: 'rgba(138,145,103,0.15)', color: 'var(--muted)', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.56rem' }}>weekly</span>}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {addSuccess && (
              <div className="px-4 py-3" style={{ background: 'rgba(107,39,55,0.06)', border: '1px solid rgba(107,39,55,0.15)', borderRadius: '4px' }}>
                <p className="text-sm" style={{ color: 'var(--wine)', fontFamily: 'var(--font-dm-sans)' }}>✓ Items added to inventory. Switch to the Inventory tab to review.</p>
              </div>
            )}

            {/* Documents */}
            <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: '1.5rem' }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Knowledge Base</p>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                Upload supplier catalogs, training docs, wine guides, SOPs — anything your AI personas should know.
              </p>

              {documents.length > 0 && (
                <div className="space-y-2 mb-5">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-start gap-3 px-4 py-3" style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)' }}>{doc.name}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>{doc.content.slice(0, 80)}…</p>
                      </div>
                      <button onClick={() => deleteDocument(doc.id)} className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)' }}>Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <input
                  className="w-full px-4 py-3 text-sm focus:outline-none"
                  style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                  placeholder="Document name (e.g. Supplier Catalog, Wine Training Guide)"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                />
                <textarea
                  className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                  style={{ background: 'white', border: '1px solid var(--cream-dark)', color: 'var(--text)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', minHeight: '140px' }}
                  placeholder={"Paste the document content here.\n\nWorks great for:\n· Supplier contact sheets\n· Wine & spirits training notes\n· Allergy & dietary guides\n· Opening/closing SOPs\n· Vintage tasting notes"}
                  value={docContent}
                  onChange={e => setDocContent(e.target.value)}
                />
                <button
                  onClick={saveDocument}
                  disabled={docSaving || !docName.trim() || !docContent.trim()}
                  className="w-full py-3 text-xs uppercase tracking-widest disabled:opacity-40"
                  style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.65rem' }}
                >
                  {docSaving ? 'Saving…' : '+ Add to Knowledge Base'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Inventory Tab ── */}
        {tab === 'inventory' && (
          <div className="space-y-8">
            <section>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Add Category</p>
              <div className="flex gap-2">
                <input className="flex-1 px-4 py-3 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                  placeholder="e.g. Coffee, Cheese, Supplies" value={newCatName} onChange={e => setNewCatName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} />
                <button onClick={addCategory} className="px-5 text-sm" style={{ background: 'var(--wine-dark)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>Add</button>
              </div>
            </section>

            <section>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Add Item</p>
              <div className="space-y-2">
                <select className="w-full px-4 py-3 focus:outline-none bg-white" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', color: 'var(--text)' }}
                  value={newItemCat} onChange={e => setNewItemCat(e.target.value)}>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <input className="w-full px-4 py-3 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                  placeholder="Item name" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                <input className="w-full px-4 py-3 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                  placeholder="Supplier (optional)" value={newItemSupplier} onChange={e => setNewItemSupplier(e.target.value)} />
                <div className="flex gap-2">
                  {([['Can Order', newItemCanOrder, () => setNewItemCanOrder(v => !v)], ['Can Make', newItemCanMake, () => setNewItemCanMake(v => !v)], ['Weekly', newItemIsWeekly, () => setNewItemIsWeekly(v => !v)]] as [string, boolean, () => void][]).map(([label, active, toggle]) => (
                    <button key={label} type="button" onClick={toggle} className="flex-1 py-2.5 text-xs uppercase tracking-widest transition-colors"
                      style={active ? { background: 'var(--wine-dark)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em', border: '1px solid var(--wine-dark)' } : { border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>
                      {label}
                    </button>
                  ))}
                </div>
                <button onClick={addItem} className="w-full py-3 text-xs uppercase tracking-widest" style={{ background: 'var(--wine-dark)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }}>Add Item</button>
              </div>
            </section>

            <section>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>Current Inventory</p>
              {itemsByCategory.map(({ category, items: catItems }) => (
                <div key={category.id} className="mb-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>{category.name}</p>
                    <div className="flex gap-3">
                      <button onClick={() => editingSupplierCatId === category.id ? setEditingSupplierCatId(null) : startEditSupplier(category)} className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                        {editingSupplierCatId === category.id ? 'Cancel' : category.supplier_email ? 'Edit supplier' : '+ Supplier'}
                      </button>
                      {catItems.length === 0 && <button onClick={() => deleteCategory(category.id)} className="text-xs" style={{ color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)' }}>Delete</button>}
                    </div>
                  </div>
                  {category.supplier_email && editingSupplierCatId !== category.id && (
                    <p className="text-xs mb-2" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>
                      ✉ {category.supplier_name || category.supplier_email}
                    </p>
                  )}
                  {editingSupplierCatId === category.id && (
                    <div className="flex gap-2 mb-2">
                      <input className="flex-1 px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                        placeholder="Supplier name" value={supplierNameInput} onChange={e => setSupplierNameInput(e.target.value)} />
                      <input className="flex-1 px-3 py-2 text-sm focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                        placeholder="supplier@email.com" value={supplierEmailInput} onChange={e => setSupplierEmailInput(e.target.value)} type="email" />
                      <button onClick={() => saveSupplier(category.id)} disabled={supplierSaving} className="px-4 py-2 text-xs disabled:opacity-40"
                        style={{ background: 'var(--wine)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>
                        {supplierSaving ? '…' : 'Save'}
                      </button>
                    </div>
                  )}

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
        )}

        {/* ── Personas Tab ── */}
        {tab === 'personas' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em', fontSize: '0.62rem' }}>AI Personas</p>
                {savedMenu && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>✓ Menu context active — personas know the full menu</p>}
              </div>
              {!showPersonaForm && <button onClick={() => setShowPersonaForm(true)} className="text-xs px-3 py-1.5 uppercase tracking-widest" style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.6rem', letterSpacing: '0.15em' }}>+ Add</button>}
            </div>

            <div className="space-y-2 mb-4">
              {personas.map(p => (
                <div key={p.id} className="px-4 py-3" style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span>
                      <div>
                        <p style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem' }}>{p.name}</p>
                        <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontFamily: 'var(--font-dm-sans)' }}>{p.title}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => startEditPersona(p)} className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>Edit</button>
                      <button onClick={() => deletePersona(p.id)} className="text-xs" style={{ color: 'var(--terra)', fontFamily: 'var(--font-dm-sans)' }}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              {personas.length === 0 && !showPersonaForm && <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>No personas yet</p>}
            </div>

            {showPersonaForm && (
              <div className="p-4 space-y-3" style={{ background: 'white', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}>
                <p className="text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-dm-sans)', fontWeight: 500 }}>{editingPersona ? `Edit ${editingPersona.name}` : 'New Persona'}</p>
                <div className="flex gap-2">
                  <input className="px-3 py-2.5 text-center text-xl focus:outline-none" style={{ width: '64px', border: '1px solid var(--cream-dark)', borderRadius: '4px' }}
                    placeholder="🤖" value={pEmoji} onChange={e => setPEmoji(e.target.value)} maxLength={2} />
                  <input className="flex-1 px-4 py-2.5 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                    placeholder="Name" value={pName} onChange={e => setPName(e.target.value)} />
                </div>
                <input className="w-full px-4 py-2.5 focus:outline-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                  placeholder="Title (e.g. Head Sommelier, Bar Director)" value={pTitle} onChange={e => setPTitle(e.target.value)} />
                <div className="flex gap-1.5 flex-wrap">
                  {PERSONA_THEMES.map(t => <button key={t} type="button" onClick={() => setPTheme(t)} className="px-3 py-1.5 text-xs border-2 transition-colors" style={{ borderColor: pTheme === t ? 'var(--wine-dark)' : 'var(--cream-dark)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', color: 'var(--text)' }}>{THEME_LABELS[t]}</button>)}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-dm-sans)' }}>System prompt</label>
                    <button onClick={generatePrompt} disabled={generatingPrompt} className="text-xs px-3 py-1 disabled:opacity-40" style={{ background: 'var(--cream-dark)', color: 'var(--text)', borderRadius: '3px', fontFamily: 'var(--font-dm-sans)', fontSize: '0.62rem' }}>
                      {generatingPrompt ? 'Generating…' : '✦ Generate with AI'}
                    </button>
                  </div>
                  <textarea className="w-full px-4 py-3 text-sm focus:outline-none resize-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                    placeholder="Tell the AI who it is — its voice, expertise, and how it should help staff." rows={5} value={pPrompt} onChange={e => setPPrompt(e.target.value)} />
                </div>
                <textarea className="w-full px-4 py-3 text-sm focus:outline-none resize-none" style={{ border: '1px solid var(--cream-dark)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}
                  placeholder={'Quick prompts — one per line\nWhat wines pair well with duck?\nWhat\'s running low this week?'} rows={3} value={pQuickPrompts} onChange={e => setPQuickPrompts(e.target.value)} />
                {personaError && <p className="text-sm px-4 py-3" style={{ background: 'rgba(193,113,79,0.08)', color: 'var(--terra)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)' }}>{personaError}</p>}
                <div className="flex gap-2">
                  <button onClick={savePersona} disabled={personaSaving} className="flex-1 py-3 text-xs uppercase tracking-widest disabled:opacity-50" style={{ background: 'var(--wine-dark)', color: 'var(--cream)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.2em' }}>
                    {personaSaving ? 'Saving...' : editingPersona ? 'Save Changes' : 'Add Persona'}
                  </button>
                  <button onClick={resetPersonaForm} className="px-5 text-xs uppercase tracking-widest" style={{ border: '1px solid var(--cream-dark)', color: 'var(--muted)', borderRadius: '4px', fontFamily: 'var(--font-dm-sans)', letterSpacing: '0.15em' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
