'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Product } from '@/types'
import { useCart } from './CartContext'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
        <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {product.images[0] && (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {product.category === 'premium' && (
            <span className="absolute top-4 right-4 bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              ✨ Premium
            </span>
          )}

          {/* Stock Status Badge */}
          <div className="absolute bottom-4 left-4">
            {(product as any).stockQuantity > 0 ? (
              (product as any).stockQuantity <= 5 ? (
                <span className="bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
                  Low Stock
                </span>
              ) : (
                <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
                  In Stock
                </span>
              )
            ) : (
              <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
                Made to Order
              </span>
            )}
          </div>

          {product.customizable && (
            <span className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              🎨 Customizable
            </span>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold mb-3 font-medieval text-gray-900 group-hover:text-yellow-500 transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-yellow-500">
              ${product.price.toFixed(2)}
            </span>
            <div className="text-sm text-gray-500">
              {typeof (product as any).material === 'object' && (product as any).material !== null
                ? ((product as any).material?.displayName || (product as any).material?.name || 'Unknown Object')
                : String((product as any).material || product.material || 'Unknown')}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="h-4 w-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="text-sm text-gray-500 ml-2">(4.8)</span>
            </div>

            <button
              onClick={handleAddToCart}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 p-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              title="Add to Cart"
            >
              <ShoppingCart className="h-5 w-5" />
            </button>
          </div>

          {!product.inStock && (
            <div className="mt-4 text-center">
              <span className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}