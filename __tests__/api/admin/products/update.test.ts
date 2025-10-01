/**
 * Tests for 3MF Color Data Persistence in Product Updates
 *
 * This test suite validates that:
 * 1. All required fields are properly saved during product updates
 * 2. 3MF color data (numberOfColors, availableColors) persists after updates
 * 3. Field validation and type conversion works correctly
 * 4. Database operations maintain data integrity
 */

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    product: {
      update: jest.fn()
    }
  }))
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  verifyToken: jest.fn()
}))

import { NextRequest } from 'next/server'
import { PUT } from '@/app/api/admin/products/[id]/route'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

// Get the mocked instances
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>

// Mock cookies
const mockCookieGet = jest.fn()

describe('Product Update API Route - 3MF Color Data Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVerifyToken.mockReturnValue(true)
    mockCookieGet.mockReturnValue({ value: 'valid-token' })
  })

  const createMockRequest = (data: any) => {
    const request = {
      cookies: {
        get: mockCookieGet
      },
      json: jest.fn().mockResolvedValue(data)
    } as unknown as NextRequest

    return request
  }

  const mockParams = Promise.resolve({ id: 'test-product-id' })

  describe('3MF Color Data Field Persistence', () => {
    it('should save all 3MF-related fields during product update', async () => {
      const testData = {
        name: 'Test Sword',
        description: 'A test sword',
        price: '99.99',
        category: 'Premium',
        image: 'https://example.com/image.jpg',
        stockQuantity: '10',
        lowStockThreshold: '2',
        manufacturingTime: '2-3 weeks',
        weightOz: '5.5',
        lengthIn: '12',
        widthIn: '3',
        heightIn: '1',
        material: 'material-id-123',
        numberOfColors: 2, // From 3MF analysis
        availableColors: ['Red', 'Blue'], // Selected colors
        modelOrientation: { x: 0.5, y: 1.0, z: 0 },
        modelFile: '/models/test.stl',
        finish: 'Matte Black',
        customizable: true,
        features: ['Custom engraving', 'Multiple colors']
      }

      mockPrisma.product.update.mockResolvedValue({
        id: 'test-product-id',
        ...testData,
        images: [testData.image],
        features: testData.features
      })

      const request = createMockRequest(testData)
      const response = await PUT(request, { params: mockParams })
      const responseData = await response.json()

      // Verify the update was called with correct data
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'test-product-id' },
        data: {
          name: 'Test Sword',
          description: 'A test sword',
          price: 99.99,
          images: ['https://example.com/image.jpg'],
          category: 'premium',
          inStock: true,
          stockQuantity: 10,
          lowStockThreshold: 2,
          manufacturingTime: '2-3 weeks',
          weightOz: 5.5,
          lengthIn: 12,
          widthIn: 3,
          heightIn: 1,
          materialId: 'material-id-123',
          numberOfColors: 2, // Ensure this is saved as integer
          availableColors: ['Red', 'Blue'], // Ensure colors array is saved
          modelOrientation: { x: 0.5, y: 1.0, z: 0 },
          modelFile: '/models/test.stl',
          finish: 'Matte Black',
          customizable: true,
          features: ['Custom engraving', 'Multiple colors'],
          updatedAt: expect.any(Date)
        }
      })

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should handle numberOfColors as string and convert to integer', async () => {
      const testData = {
        name: 'Test Product',
        description: 'Test',
        price: '50.00',
        stockQuantity: '5',
        numberOfColors: '3', // String value from form
        availableColors: ['Red', 'Green', 'Blue'],
        material: 'material-id'
      }

      mockPrisma.product.update.mockResolvedValue({ id: 'test-id', ...testData })

      const request = createMockRequest(testData)
      await PUT(request, { params: mockParams })

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numberOfColors: 3 // Should be converted to integer
          })
        })
      )
    })

    it('should preserve availableColors array structure', async () => {
      const testColors = ['Black', 'White', 'Gold', 'Silver']
      const testData = {
        name: 'Multi-Color Product',
        description: 'Test multi-color',
        price: '150.00',
        stockQuantity: '3',
        numberOfColors: 4,
        availableColors: testColors,
        material: 'material-id'
      }

      mockPrisma.product.update.mockResolvedValue({ id: 'test-id', ...testData })

      const request = createMockRequest(testData)
      await PUT(request, { params: mockParams })

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            availableColors: testColors // Should preserve exact array
          })
        })
      )
    })

    it('should handle missing optional 3MF fields with defaults', async () => {
      const minimalData = {
        name: 'Minimal Product',
        description: 'Minimal test',
        price: '25.00',
        stockQuantity: '1'
        // Missing: numberOfColors, availableColors, modelFile, etc.
      }

      mockPrisma.product.update.mockResolvedValue({ id: 'test-id', ...minimalData })

      const request = createMockRequest(minimalData)
      await PUT(request, { params: mockParams })

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numberOfColors: 1, // Should default to 1
            availableColors: [], // Should default to empty array
            modelFile: null, // Should default to null
            finish: 'Standard', // Should have default value
            customizable: false, // Should default to false
            features: [] // Should default to empty array
          })
        })
      )
    })
  })

  describe('Data Type Validation', () => {
    it('should convert string numbers to appropriate types', async () => {
      const testData = {
        name: 'Type Test',
        description: 'Testing type conversion',
        price: '123.45', // String
        stockQuantity: '10', // String
        lowStockThreshold: '3', // String
        numberOfColors: '2', // String
        weightOz: '4.5', // String
        lengthIn: '8.0', // String
        widthIn: '2.5', // String
        heightIn: '1.0' // String
      }

      mockPrisma.product.update.mockResolvedValue({ id: 'test-id' })

      const request = createMockRequest(testData)
      await PUT(request, { params: mockParams })

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: 123.45, // Should be float
            stockQuantity: 10, // Should be integer
            lowStockThreshold: 3, // Should be integer
            numberOfColors: 2, // Should be integer
            weightOz: 4.5, // Should be float
            lengthIn: 8.0, // Should be float
            widthIn: 2.5, // Should be float
            heightIn: 1.0 // Should be float
          })
        })
      )
    })

    it('should handle zero and empty values correctly', async () => {
      const testData = {
        name: 'Zero Test',
        description: 'Testing zero values',
        price: '0',
        stockQuantity: '0', // Should make inStock false
        numberOfColors: '0' // Should become 1 (minimum)
      }

      mockPrisma.product.update.mockResolvedValue({ id: 'test-id' })

      const request = createMockRequest(testData)
      await PUT(request, { params: mockParams })

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stockQuantity: 0,
            inStock: false, // Should be false when stock is 0
            numberOfColors: 1 // Should default to 1 when 0
          })
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 401 for invalid authentication', async () => {
      mockVerifyToken.mockReturnValue(false)

      const request = createMockRequest({})
      const response = await PUT(request, { params: mockParams })

      expect(response.status).toBe(401)
      expect(mockPrisma.product.update).not.toHaveBeenCalled()
    })

    it('should return 400 for missing required fields', async () => {
      const incompleteData = {
        name: 'Test'
        // Missing: description, price, stockQuantity
      }

      const request = createMockRequest(incompleteData)
      const response = await PUT(request, { params: mockParams })

      expect(response.status).toBe(400)
      expect(mockPrisma.product.update).not.toHaveBeenCalled()
    })

    it('should return 500 for database errors', async () => {
      mockPrisma.product.update.mockRejectedValue(new Error('Database error'))

      const testData = {
        name: 'Test',
        description: 'Test',
        price: '10.00',
        stockQuantity: '1'
      }

      const request = createMockRequest(testData)
      const response = await PUT(request, { params: mockParams })

      expect(response.status).toBe(500)
    })
  })

  describe('3MF Integration Scenarios', () => {
    it('should persist color data when updating after 3MF upload', async () => {
      // Simulate scenario: User uploads 3MF -> analysis suggests 2 colors -> user updates product
      const updateAfter3MFUpload = {
        name: '3MF Sword',
        description: 'Uploaded from 3MF',
        price: '79.99',
        stockQuantity: '5',
        numberOfColors: 2, // From 3MF analysis
        availableColors: ['Red', 'Black'], // User selected these
        modelFile: '/models/uploaded-sword.3mf',
        material: 'pla-material-id',
        finish: 'Glossy',
        customizable: true,
        features: ['Multi-color printing', '3MF compatible']
      }

      mockPrisma.product.update.mockResolvedValue({
        id: 'test-id',
        ...updateAfter3MFUpload
      })

      const request = createMockRequest(updateAfter3MFUpload)
      const response = await PUT(request, { params: mockParams })
      const responseData = await response.json()

      // Verify all 3MF-related data is persisted
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numberOfColors: 2,
            availableColors: ['Red', 'Black'],
            modelFile: '/models/uploaded-sword.3mf',
            customizable: true,
            features: ['Multi-color printing', '3MF compatible']
          })
        })
      )

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
    })

    it('should handle complex model orientation data', async () => {
      const complexOrientation = {
        x: 1.5708, // 90 degrees in radians
        y: -0.7854, // -45 degrees in radians
        z: 3.1416 // 180 degrees in radians
      }

      const testData = {
        name: 'Oriented Model',
        description: 'Model with complex orientation',
        price: '65.00',
        stockQuantity: '2',
        modelOrientation: complexOrientation
      }

      mockPrisma.product.update.mockResolvedValue({ id: 'test-id' })

      const request = createMockRequest(testData)
      await PUT(request, { params: mockParams })

      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modelOrientation: complexOrientation
          })
        })
      )
    })
  })
})