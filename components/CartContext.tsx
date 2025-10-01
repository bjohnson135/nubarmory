'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { CartItem, Product } from '@/types'

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, customization?: any) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const parsedItems = JSON.parse(savedCart)
        // Sanitize items to ensure no problematic customization objects and add IDs if missing
        const sanitizedItems = parsedItems.map((item: any, index: number) => ({
          ...item,
          // Generate ID if missing (for backward compatibility)
          id: item.id || `cart-item-${Date.now()}-${index}`,
          // Ensure customization doesn't have non-serializable objects
          customization: item.customization && typeof item.customization === 'object'
            ? {
                engraving: typeof item.customization.engraving === 'string' ? item.customization.engraving : undefined,
                finish: typeof item.customization.finish === 'string' ? item.customization.finish : undefined,
                material: typeof item.customization.material === 'string' ? item.customization.material : undefined
              }
            : undefined
        }))
        setItems(sanitizedItems)
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error)
        // Clear corrupted cart data
        localStorage.removeItem('cart')
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  const addItem = (product: Product, quantity = 1, customization?: any) => {
    setItems(prev => {
      // Find existing item with same product AND same customization
      const existing = prev.find(item =>
        item.product.id === product.id &&
        JSON.stringify(item.customization) === JSON.stringify(customization)
      )
      if (existing) {
        return prev.map(item =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      // Generate unique ID for new cart item
      const newItemId = `cart-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      return [...prev, { id: newItemId, product, quantity, customization }]
    })
  }

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}