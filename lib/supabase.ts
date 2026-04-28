import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Missing Supabase env vars. Check .env.local')
    _client = createClient(url, key)
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getSupabase() as any)[prop]
  },
})

export type Category = {
  id: string
  name: string
  shop_id: string
  sort_order: number
  supplier_name: string | null
  supplier_email: string | null
}

export type Item = {
  id: string
  name: string
  category_id: string
  typical_supplier: string | null
  is_active: boolean
  can_order: boolean
  can_make: boolean
  is_weekly: boolean
}

export type Flag = {
  id: string
  item_id: string
  flagged_by: string
  flagged_at: string
  note: string | null
  status: 'pending' | 'ordered' | 'received'
  item?: Item & { category?: Category }
}

export type Task = {
  id: string
  item_id: string
  flagged_by: string
  flagged_at: string
  note: string | null
  urgency: 'urgent' | 'normal'
  status: 'pending' | 'in_progress' | 'done'
  item?: Item & { category?: Category }
}

export type ShopDocument = {
  id: string
  shop_id: string
  name: string
  content: string
  created_at: string
}

export type AIPersona = {
  id: string
  shop_id: string
  name: string
  title: string
  emoji: string
  theme: string
  system_prompt: string
  quick_prompts: string[]
  sort_order: number
  is_active: boolean
}
