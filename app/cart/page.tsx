'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2, ChevronRight, Palette } from 'lucide-react'
import { useCart } from '@/components/CartContext'
import { formatColorSelection } from '@/lib/colors'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart()

  const TAX_RATE = 0.08
  const SHIPPING = items.length > 0 ? 9.99 : 0
  const tax = totalPrice * TAX_RATE
  const finalTotal = totalPrice + tax + SHIPPING

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-8">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Add some legendary items to your arsenal!
          </p>
          <Link
            href="/products"
            className="bg-gray-900 text-white px-8 py-3 rounded font-semibold hover:bg-gray-800 transition-colors inline-flex items-center"
          >
            Continue Shopping
            <ChevronRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-6 border-b last:border-b-0"
                >
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 bg-gray-200 rounded">
                      {item.product.images[0] && (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {item.product.name}
                      </h3>
                      {item.customization?.engraving && (
                        <p className="text-sm text-gray-600 mb-1">
                          Engraving: {item.customization.engraving}
                        </p>
                      )}
                      {item.customization?.colors && item.customization.colors.length > 0 && (
                        <p className="text-sm text-gray-600 mb-2 flex items-center">
                          <Palette className="h-3 w-3 mr-1" />
                          Colors: {formatColorSelection(item.customization.colors)}
                        </p>
                      )}
                      <p className="text-nub-gold font-semibold">
                        ${item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded border hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded border hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${SHIPPING.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-nub-gold">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-gray-900 text-white py-3 rounded font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                Proceed to Checkout
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}