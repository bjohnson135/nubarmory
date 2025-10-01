import { getProductById, getAllProducts } from '@/lib/products'
import ProductDetail from '@/components/ProductDetail'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  try {
    const products = await getAllProducts()
    return products
      .filter((product) => product.id) // Filter out products without IDs
      .map((product) => ({
        id: product.id,
      }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(id)

  if (!product) {
    notFound()
  }

  return <ProductDetail product={product} />
}