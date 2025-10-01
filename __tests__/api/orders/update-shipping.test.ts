/**
 * @jest-environment node
 */

import '@/../jest.setup.node.js'
import { POST } from '@/app/api/orders/[id]/update-shipping/route'
import { PrismaClient } from '@prisma/client'
import { NextRequest } from 'next/server'

// Mock PrismaClient
jest.mock('@prisma/client')
const mockPrismaUpdate = jest.fn()
const mockPrisma = {
  order: {
    update: mockPrismaUpdate
  }
} as unknown as PrismaClient

// Mock the import
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}))

// Mock NextRequest
const mockJson = jest.fn()
const mockRequest = {
  json: mockJson
} as unknown as NextRequest

const mockParams = Promise.resolve({ id: 'test-order-id' })

describe('/api/orders/[id]/update-shipping', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should update order with shipping address and customer info', async () => {
    const requestData = {
      customerInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      },
      shippingAddress: {
        line1: '123 Main St',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US'
      }
    }

    const updatedOrder = {
      id: 'test-order-id',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '+1234567890',
      shippingAddress: requestData.shippingAddress,
      total: 150.00,
      status: 'pending'
    }

    mockJson.mockResolvedValue(requestData)
    mockPrismaUpdate.mockResolvedValue(updatedOrder)

    const response = await POST(mockRequest, { params: mockParams })
    const responseData = await response.json()

    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: 'test-order-id' },
      data: {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+1234567890',
        shippingAddress: requestData.shippingAddress
      }
    })

    expect(response.status).toBe(200)
    expect(responseData).toEqual({
      success: true,
      order: updatedOrder
    })
  })

  it('should handle missing optional address fields', async () => {
    const requestData = {
      customerInfo: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1987654321'
      },
      shippingAddress: {
        line1: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90210',
        country: 'US'
        // line2 is intentionally missing
      }
    }

    const updatedOrder = {
      id: 'test-order-id',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      customerPhone: '+1987654321',
      shippingAddress: requestData.shippingAddress,
      total: 89.99,
      status: 'pending'
    }

    mockJson.mockResolvedValue(requestData)
    mockPrismaUpdate.mockResolvedValue(updatedOrder)

    const response = await POST(mockRequest, { params: mockParams })
    const responseData = await response.json()

    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: 'test-order-id' },
      data: {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+1987654321',
        shippingAddress: requestData.shippingAddress
      }
    })

    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)
  })

  it('should handle database errors gracefully', async () => {
    const requestData = {
      customerInfo: {
        name: 'Error User',
        email: 'error@example.com',
        phone: '+1111111111'
      },
      shippingAddress: {
        line1: '789 Error St',
        city: 'Error City',
        state: 'ER',
        zipCode: '00000',
        country: 'US'
      }
    }

    mockJson.mockResolvedValue(requestData)
    mockPrismaUpdate.mockRejectedValue(new Error('Database connection failed'))

    const response = await POST(mockRequest, { params: mockParams })
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData).toEqual({
      error: 'Failed to update order'
    })
  })

  it('should handle malformed request data', async () => {
    mockJson.mockRejectedValue(new Error('Invalid JSON'))

    const response = await POST(mockRequest, { params: mockParams })
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData).toEqual({
      error: 'Failed to update order'
    })
  })

  it('should update order with international address', async () => {
    const requestData = {
      customerInfo: {
        name: 'Pierre Dubois',
        email: 'pierre@example.fr',
        phone: '+33123456789'
      },
      shippingAddress: {
        line1: '123 Rue de la Paix',
        line2: 'Appartement 5',
        city: 'Paris',
        state: 'Île-de-France',
        zipCode: '75001',
        country: 'FR'
      }
    }

    const updatedOrder = {
      id: 'test-order-id',
      customerName: 'Pierre Dubois',
      customerEmail: 'pierre@example.fr',
      customerPhone: '+33123456789',
      shippingAddress: requestData.shippingAddress,
      total: 120.50,
      status: 'pending'
    }

    mockJson.mockResolvedValue(requestData)
    mockPrismaUpdate.mockResolvedValue(updatedOrder)

    const response = await POST(mockRequest, { params: mockParams })
    const responseData = await response.json()

    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: 'test-order-id' },
      data: {
        customerName: 'Pierre Dubois',
        customerEmail: 'pierre@example.fr',
        customerPhone: '+33123456789',
        shippingAddress: requestData.shippingAddress
      }
    })

    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)
  })

  it('should preserve shipping address structure', async () => {
    const requestData = {
      customerInfo: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1555555555'
      },
      shippingAddress: {
        line1: '100 Test Blvd',
        line2: 'Suite 200',
        city: 'Test City',
        state: 'TX',
        zipCode: '12345',
        country: 'US'
      }
    }

    mockJson.mockResolvedValue(requestData)
    mockPrismaUpdate.mockResolvedValue({
      id: 'test-order-id',
      ...requestData.customerInfo,
      customerName: requestData.customerInfo.name,
      customerEmail: requestData.customerInfo.email,
      customerPhone: requestData.customerInfo.phone,
      shippingAddress: requestData.shippingAddress,
      total: 99.99,
      status: 'pending'
    })

    const response = await POST(mockRequest, { params: mockParams })
    await response.json()

    // Verify that the shipping address is passed through exactly as received
    expect(mockPrismaUpdate).toHaveBeenCalledWith({
      where: { id: 'test-order-id' },
      data: {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '+1555555555',
        shippingAddress: requestData.shippingAddress
      }
    })

    // Ensure the structure matches what order success page expects
    const expectedAddress = requestData.shippingAddress
    expect(expectedAddress).toHaveProperty('line1')
    expect(expectedAddress).toHaveProperty('line2')
    expect(expectedAddress).toHaveProperty('city')
    expect(expectedAddress).toHaveProperty('state')
    expect(expectedAddress).toHaveProperty('zipCode')
    expect(expectedAddress).toHaveProperty('country')
  })
})