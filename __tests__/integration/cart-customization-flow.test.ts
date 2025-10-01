/**
 * @jest-environment node
 */

/**
 * Integration test for cart customization and order flow
 * Tests the complete workflow from adding customized items to cart through order completion
 */

import '@/../jest.setup.node.js'
import { PrismaClient } from '@prisma/client'

// Mock PrismaClient for order creation and retrieval
jest.mock('@prisma/client')
const mockPrismaCreate = jest.fn()
const mockPrismaUpdate = jest.fn()
const mockPrismaFindUnique = jest.fn()
const mockPrisma = {
  order: {
    create: mockPrismaCreate,
    update: mockPrismaUpdate,
    findUnique: mockPrismaFindUnique
  }
} as unknown as PrismaClient

// Mock the import
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Import the API routes we're testing
import { POST as createPaymentIntent } from '@/app/api/checkout/create-payment-intent/route'
import { POST as updateShipping } from '@/app/api/orders/[id]/update-shipping/route'
import { GET as getOrder } from '@/app/api/orders/[id]/route'

describe('Cart Customization Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockCartItems = [
    {
      id: 'cart-item-1',
      product: {
        id: 'product-sword',
        name: 'Sword Hilt',
        price: 89.99,
        description: 'Premium sword hilt',
        images: ['/images/sword.jpg'],
        category: 'premium' as const,
        material: 'PLA+',
        finish: 'Standard',
        inStock: true,
        customizable: true,
        features: ['Engraving', 'Multi-color']
      },
      quantity: 1,
      customization: {
        engraving: 'For Honor',
        colors: ['Red', 'Gold'],
        finish: 'Matte'
      }
    },
    {
      id: 'cart-item-2',
      product: {
        id: 'product-sword',
        name: 'Sword Hilt',
        price: 89.99,
        description: 'Premium sword hilt',
        images: ['/images/sword.jpg'],
        category: 'premium' as const,
        material: 'PLA+',
        finish: 'Standard',
        inStock: true,
        customizable: true,
        features: ['Engraving', 'Multi-color']
      },
      quantity: 1,
      customization: {
        engraving: 'Victory',
        colors: ['Blue', 'Silver'],
        finish: 'Glossy'
      }
    },
    {
      id: 'cart-item-3',
      product: {
        id: 'product-stand',
        name: 'Cigar Stand',
        price: 25.00,
        description: 'Basic cigar stand',
        images: ['/images/stand.jpg'],
        category: 'standard' as const,
        material: 'PLA',
        finish: 'Standard',
        inStock: true,
        customizable: false,
        features: []
      },
      quantity: 2,
      customization: undefined
    }
  ]

  const mockCustomerInfo = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  }

  const mockShippingAddress = {
    line1: '123 Main Street',
    line2: 'Apartment 4B',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'US'
  }

  it('should handle complete cart-to-order flow with individual customizations', async () => {
    // Step 1: Create payment intent with cart items
    const orderId = 'test-order-12345'
    const mockCreatedOrder = {
      id: orderId,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      shippingAddress: {},
      subtotal: 204.98,
      tax: 16.40,
      shipping: 9.99,
      total: 231.37,
      status: 'pending',
      paymentMethod: 'stripe',
      paymentIntentId: 'pi_test_12345',
      items: {
        create: mockCartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          customization: item.customization || null
        }))
      }
    }

    mockPrismaCreate.mockResolvedValue({ id: orderId, ...mockCreatedOrder })

    const createPaymentRequest = {
      json: jest.fn().mockResolvedValue({
        items: mockCartItems,
        customerInfo: mockCustomerInfo,
        shippingAddress: mockShippingAddress
      })
    } as unknown as Request

    const paymentResponse = await createPaymentIntent(createPaymentRequest)
    const paymentData = await paymentResponse.json()

    expect(paymentData.orderId).toBe(orderId)
    expect(mockPrismaCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtotal: 204.98, // (89.99 * 2) + (25.00 * 2)
        tax: expect.any(Number),
        shipping: 9.99,
        total: expect.any(Number),
        items: {
          create: [
            {
              productId: 'product-sword',
              quantity: 1,
              price: 89.99,
              customization: {
                engraving: 'For Honor',
                colors: ['Red', 'Gold'],
                finish: 'Matte'
              }
            },
            {
              productId: 'product-sword',
              quantity: 1,
              price: 89.99,
              customization: {
                engraving: 'Victory',
                colors: ['Blue', 'Silver'],
                finish: 'Glossy'
              }
            },
            {
              productId: 'product-stand',
              quantity: 2,
              price: 25.00,
              customization: null
            }
          ]
        }
      })
    })

    // Step 2: Update order with shipping information
    const mockUpdatedOrder = {
      id: orderId,
      customerName: mockCustomerInfo.name,
      customerEmail: mockCustomerInfo.email,
      customerPhone: mockCustomerInfo.phone,
      shippingAddress: mockShippingAddress,
      ...mockCreatedOrder
    }

    mockPrismaUpdate.mockResolvedValue(mockUpdatedOrder)

    const updateShippingRequest = {
      json: jest.fn().mockResolvedValue({
        customerInfo: mockCustomerInfo,
        shippingAddress: mockShippingAddress
      })
    } as unknown as Request

    const updateResponse = await updateShipping(
      updateShippingRequest,
      { params: Promise.resolve({ id: orderId }) }
    )
    const updateData = await updateResponse.json()

    expect(updateData.success).toBe(true)
    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: orderId },
      data: {
        customerName: mockCustomerInfo.name,
        customerEmail: mockCustomerInfo.email,
        customerPhone: mockCustomerInfo.phone,
        shippingAddress: mockShippingAddress
      }
    })

    // Step 3: Retrieve order for display on success page
    const mockOrderWithItems = {
      id: orderId,
      customerName: mockCustomerInfo.name,
      customerEmail: mockCustomerInfo.email,
      total: 231.37,
      status: 'pending',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      shippingAddress: mockShippingAddress,
      items: [
        {
          product: { name: 'Sword Hilt' },
          quantity: 1,
          price: 89.99,
          customization: {
            engraving: 'For Honor',
            colors: ['Red', 'Gold'],
            finish: 'Matte'
          }
        },
        {
          product: { name: 'Sword Hilt' },
          quantity: 1,
          price: 89.99,
          customization: {
            engraving: 'Victory',
            colors: ['Blue', 'Silver'],
            finish: 'Glossy'
          }
        },
        {
          product: { name: 'Cigar Stand' },
          quantity: 2,
          price: 25.00,
          customization: null
        }
      ]
    }

    mockPrismaFindUnique.mockResolvedValue(mockOrderWithItems)

    const getOrderRequest = {} as Request
    const getOrderResponse = await getOrder(
      getOrderRequest,
      { params: Promise.resolve({ id: orderId }) }
    )
    const orderData = await getOrderResponse.json()

    expect(orderData.order).toEqual({
      id: orderId,
      customerName: mockCustomerInfo.name,
      customerEmail: mockCustomerInfo.email,
      total: 231.37,
      status: 'pending',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      shippingAddress: mockShippingAddress,
      items: [
        {
          productName: 'Sword Hilt',
          quantity: 1,
          price: 89.99,
          customization: {
            engraving: 'For Honor',
            colors: ['Red', 'Gold'],
            finish: 'Matte'
          }
        },
        {
          productName: 'Sword Hilt',
          quantity: 1,
          price: 89.99,
          customization: {
            engraving: 'Victory',
            colors: ['Blue', 'Silver'],
            finish: 'Glossy'
          }
        },
        {
          productName: 'Cigar Stand',
          quantity: 2,
          price: 25.00,
          customization: null
        }
      ]
    })
  })

  it('should preserve individual customizations through the entire flow', async () => {
    // Test that each item maintains its unique customization
    const orderId = 'test-customization-preservation'

    // Create order with individual customized items
    mockPrismaCreate.mockResolvedValue({ id: orderId })

    const createRequest = {
      json: jest.fn().mockResolvedValue({
        items: mockCartItems,
        customerInfo: mockCustomerInfo,
        shippingAddress: mockShippingAddress
      })
    } as unknown as Request

    await createPaymentIntent(createRequest)

    // Verify that each item's customization is preserved in order creation
    const createCall = mockPrismaCreate.mock.calls[0][0]
    const createdItems = createCall.data.items.create

    expect(createdItems).toHaveLength(3)

    // First sword with "For Honor" engraving
    expect(createdItems[0]).toEqual({
      productId: 'product-sword',
      quantity: 1,
      price: 89.99,
      customization: {
        engraving: 'For Honor',
        colors: ['Red', 'Gold'],
        finish: 'Matte'
      }
    })

    // Second sword with "Victory" engraving
    expect(createdItems[1]).toEqual({
      productId: 'product-sword',
      quantity: 1,
      price: 89.99,
      customization: {
        engraving: 'Victory',
        colors: ['Blue', 'Silver'],
        finish: 'Glossy'
      }
    })

    // Stand with no customization
    expect(createdItems[2]).toEqual({
      productId: 'product-stand',
      quantity: 2,
      price: 25.00,
      customization: null
    })
  })

  it('should handle items with no customization correctly', async () => {
    const simpleCartItems = [
      {
        id: 'cart-item-simple',
        product: {
          id: 'product-basic',
          name: 'Basic Item',
          price: 10.00,
          description: 'Simple item',
          images: [],
          category: 'standard' as const,
          material: 'PLA',
          finish: 'Standard',
          inStock: true,
          customizable: false,
          features: []
        },
        quantity: 1,
        customization: undefined
      }
    ]

    mockPrismaCreate.mockResolvedValue({ id: 'simple-order' })

    const createRequest = {
      json: jest.fn().mockResolvedValue({
        items: simpleCartItems,
        customerInfo: mockCustomerInfo,
        shippingAddress: mockShippingAddress
      })
    } as unknown as Request

    await createPaymentIntent(createRequest)

    const createCall = mockPrismaCreate.mock.calls[0][0]
    const createdItems = createCall.data.items.create

    expect(createdItems[0]).toEqual({
      productId: 'product-basic',
      quantity: 1,
      price: 10.00,
      customization: null
    })
  })

  it('should calculate totals correctly for mixed customized items', async () => {
    // Test that pricing is calculated correctly regardless of customizations
    mockPrismaCreate.mockResolvedValue({ id: 'pricing-test-order' })

    const createRequest = {
      json: jest.fn().mockResolvedValue({
        items: mockCartItems,
        customerInfo: mockCustomerInfo,
        shippingAddress: mockShippingAddress
      })
    } as unknown as Request

    await createPaymentIntent(createRequest)

    const createCall = mockPrismaCreate.mock.calls[0][0]
    const orderData = createCall.data

    // Verify subtotal calculation: (89.99 * 2) + (25.00 * 2) = 229.98
    expect(orderData.subtotal).toBeCloseTo(229.98, 2)

    // Verify tax calculation (8% of subtotal)
    expect(orderData.tax).toBeCloseTo(18.40, 2)

    // Verify shipping
    expect(orderData.shipping).toBe(9.99)

    // Verify total
    expect(orderData.total).toBeCloseTo(258.37, 2)
  })

  it('should handle shipping address structure correctly', async () => {
    const orderId = 'shipping-test-order'
    mockPrismaUpdate.mockResolvedValue({ id: orderId })

    const updateRequest = {
      json: jest.fn().mockResolvedValue({
        customerInfo: mockCustomerInfo,
        shippingAddress: mockShippingAddress
      })
    } as unknown as Request

    await updateShipping(updateRequest, { params: Promise.resolve({ id: orderId }) })

    const updateCall = mockPrismaUpdate.mock.calls[0][0]
    const savedAddress = updateCall.data.shippingAddress

    // Verify all address fields are preserved
    expect(savedAddress).toEqual({
      line1: '123 Main Street',
      line2: 'Apartment 4B',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US'
    })
  })
})