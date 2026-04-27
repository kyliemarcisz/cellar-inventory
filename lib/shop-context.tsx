'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { ReactNode } from 'react'

export type Shop = {
  id: string
  slug: string
  name: string
  address: string | null
  type: string
  tagline: string | null
  theme: string | null
}

type ShopCtx = {
  shop: Shop | null
  shopId: string | null
  catIds: string[]
  itemIds: string[]
  loading: boolean
  notFound: boolean
}

const Ctx = createContext<ShopCtx>({
  shop: null, shopId: null, catIds: [], itemIds: [], loading: true, notFound: false,
})

export function ShopProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [shop, setShop] = useState<Shop | null>(null)
  const [catIds, setCatIds] = useState<string[]>([])
  const [itemIds, setItemIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function resolve() {
      const { data: shopData } = await supabase
        .from('shops').select('*').eq('slug', slug).single()

      if (!shopData) { setNotFound(true); setLoading(false); return }
      setShop(shopData as Shop)

      const { data: cats } = await supabase
        .from('categories').select('id').eq('shop_id', shopData.id)
      const cIds = cats?.map((c: { id: string }) => c.id) || []
      setCatIds(cIds)

      if (cIds.length > 0) {
        const { data: items } = await supabase
          .from('items').select('id').in('category_id', cIds)
        setItemIds(items?.map((i: { id: string }) => i.id) || [])
      }

      setLoading(false)
    }
    resolve()
  }, [slug])

  return (
    <Ctx.Provider value={{ shop, shopId: shop?.id || null, catIds, itemIds, loading, notFound }}>
      {children}
    </Ctx.Provider>
  )
}

export function useShop() {
  return useContext(Ctx)
}
