import { ShopProvider } from '@/lib/shop-context'

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ shop: string }>
}) {
  const { shop } = await params
  return <ShopProvider slug={shop}>{children}</ShopProvider>
}
