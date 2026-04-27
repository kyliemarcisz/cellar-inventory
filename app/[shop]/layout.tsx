import { ShopProvider } from '@/lib/shop-context'
import { getSupabase } from '@/lib/supabase'
import { THEMES } from '@/lib/themes'

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ shop: string }>
}) {
  const { shop } = await params

  const { data } = await getSupabase()
    .from('shops')
    .select('theme')
    .eq('slug', shop)
    .single()

  const theme = (data?.theme as string) || 'cellar'
  const vars = THEMES[theme]?.vars ?? {}
  const cssVars = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')

  return (
    <ShopProvider slug={shop}>
      {cssVars && (
        <style>{`:root{${cssVars}}`}</style>
      )}
      {children}
    </ShopProvider>
  )
}
