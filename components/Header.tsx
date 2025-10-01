'use client'

import Link from 'next/link'
import { ShoppingCart, Sword, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCart } from './CartContext'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { totalItems } = useCart()

  return (
    <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <Sword className="h-8 w-8 text-yellow-500 group-hover:rotate-12 transition-transform" />
            <div>
              <h1 className="text-2xl font-bold font-medieval">NubArmory</h1>
              <p className="text-xs text-gray-300">Veteran Owned • Made to Order</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="hover:text-yellow-500 transition-colors">
              Products
            </Link>
            <Link href="/custom-order" className="hover:text-yellow-500 transition-colors">
              Custom Orders
            </Link>
            <Link href="/about" className="hover:text-yellow-500 transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-yellow-500 transition-colors">
              Contact
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/cart" className="relative group">
              <ShoppingCart className="h-6 w-6 group-hover:text-yellow-500 transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-700 pt-4">
            <Link
              href="/products"
              className="block py-2 hover:text-yellow-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/custom-order"
              className="block py-2 hover:text-yellow-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Custom Orders
            </Link>
            <Link
              href="/about"
              className="block py-2 hover:text-yellow-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="block py-2 hover:text-yellow-500 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}