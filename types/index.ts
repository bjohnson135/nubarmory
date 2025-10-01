export interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: 'standard' | 'premium' | 'custom'
  material: string
  finish: string
  inStock: boolean
  customizable: boolean
  features: string[]
}

export interface CartItem {
  id: string
  product: Product
  quantity: number
  customization?: {
    engraving?: string
    finish?: string
    material?: string
  }
}

export interface Order {
  id: string
  items: CartItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
  customerInfo: CustomerInfo
  paymentMethod: string
  createdAt: Date
  updatedAt: Date
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

export interface CustomOrderRequest {
  name: string
  email: string
  phone: string
  description: string
  referenceImages?: string[]
  budget: string
  timeline: string
}