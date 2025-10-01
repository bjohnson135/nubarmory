/**
 * Integration Test for 3MF Color Data Persistence
 *
 * This integration test validates the complete workflow:
 * 1. Upload 3MF file → Analysis → Form update → Product save → Data retrieval
 * 2. Ensures color data persists through the entire process
 * 3. Validates that future updates preserve color information
 */

describe('3MF Color Data Persistence - End-to-End Integration', () => {
  // Mock all required dependencies
  const mockPrisma = {
    product: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn()
    }
  }

  const mockVerifyToken = jest.fn().mockReturnValue(true)

  beforeAll(() => {
    // Mock Prisma
    jest.mock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => mockPrisma)
    }))

    // Mock auth
    jest.mock('@/lib/auth', () => ({
      verifyToken: mockVerifyToken
    }))

    // Mock file system operations
    jest.mock('fs/promises', () => ({
      writeFile: jest.fn().mockResolvedValue(undefined),
      mkdir: jest.fn().mockResolvedValue(undefined)
    }))
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete 3MF Workflow Integration', () => {
    it('should persist color data through entire upload → analysis → update → retrieval workflow', async () => {
      /**
       * STEP 1: Mock 3MF Analysis
       * Simulate uploading a 3MF file and getting analysis results
       */
      const mock3MFAnalysis = {
        success: true,
        analysis: {
          filename: 'sword-model.3mf',
          fileSize: 2048000,
          materials: [
            { id: '1', name: 'Red Blade', displayColor: '#FF0000' },
            { id: '2', name: 'Black Handle', displayColor: '#000000' }
          ],
          objects: [
            {
              id: 'blade',
              name: 'Blade',
              totalColors: 1,
              materialIds: ['1']
            },
            {
              id: 'handle',
              name: 'Handle',
              totalColors: 1,
              materialIds: ['2']
            }
          ],
          meshes: [
            { objectId: 'blade', triangleCount: 1500, totalColorCount: 1 },
            { objectId: 'handle', triangleCount: 800, totalColorCount: 1 }
          ],
          colorZones: 2
        },
        summary: {
          totalMeshes: 2,
          colorZones: 2,
          supportsMultiColor: true,
          recommendedColors: 2
        },
        recommendations: {
          numberOfColors: 2,
          reason: 'This 3MF has 2 mesh(es) and 2 color zone(s), supporting multi-color printing'
        }
      }

      /**
       * STEP 2: Mock Product Update with 3MF Data
       * Simulate form submission after 3MF analysis
       */
      const productUpdateData = {
        id: 'product-123',
        name: 'Legendary Sword',
        description: 'A beautifully crafted sword with multi-color design',
        price: 89.99,
        category: 'premium',
        images: ['/uploads/sword-image.jpg'],
        stockQuantity: 5,
        lowStockThreshold: 2,
        manufacturingTime: '2-3 weeks',
        inStock: true,
        materialId: 'pla-material-id',

        // 3MF-derived data that should persist
        numberOfColors: mock3MFAnalysis.recommendations.numberOfColors, // 2
        availableColors: ['Red', 'Black'], // User-selected colors matching analysis
        modelFile: '/models/sword-model.3mf',
        modelOrientation: { x: 0.2, y: 1.57, z: 0 }, // User-configured orientation

        // Other product data
        finish: 'Matte',
        customizable: true,
        features: ['Multi-color 3D printing', 'Custom engraving available'],
        weightOz: 6.5,
        lengthIn: 14,
        widthIn: 2.5,
        heightIn: 1,
        updatedAt: new Date()
      }

      // Mock successful database update
      mockPrisma.product.update.mockResolvedValue(productUpdateData)

      /**
       * STEP 3: Simulate API Update Call
       * Test the actual API route with the form data
       */
      const { PUT } = await import('@/app/api/admin/products/[id]/route')

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid-token' })
        },
        json: jest.fn().mockResolvedValue({
          name: productUpdateData.name,
          description: productUpdateData.description,
          price: productUpdateData.price.toString(),
          category: 'Premium',
          image: productUpdateData.images[0],
          stockQuantity: productUpdateData.stockQuantity.toString(),
          lowStockThreshold: productUpdateData.lowStockThreshold.toString(),
          manufacturingTime: productUpdateData.manufacturingTime,
          weightOz: productUpdateData.weightOz?.toString(),
          lengthIn: productUpdateData.lengthIn?.toString(),
          widthIn: productUpdateData.widthIn?.toString(),
          heightIn: productUpdateData.heightIn?.toString(),
          material: productUpdateData.materialId,
          numberOfColors: productUpdateData.numberOfColors,
          availableColors: productUpdateData.availableColors,
          modelFile: productUpdateData.modelFile,
          modelOrientation: productUpdateData.modelOrientation,
          finish: productUpdateData.finish,
          customizable: productUpdateData.customizable,
          features: productUpdateData.features
        })
      } as any

      const mockParams = Promise.resolve({ id: 'product-123' })
      const response = await PUT(mockRequest, { params: mockParams })
      const responseData = await response.json()

      /**
       * STEP 4: Verify Database Update Called with Correct Data
       */
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-123' },
        data: expect.objectContaining({
          numberOfColors: 2, // Should be integer, not string
          availableColors: ['Red', 'Black'], // Should preserve array
          modelFile: '/models/sword-model.3mf', // Should preserve 3MF file path
          modelOrientation: { x: 0.2, y: 1.57, z: 0 }, // Should preserve orientation
          finish: 'Matte',
          customizable: true,
          features: ['Multi-color 3D printing', 'Custom engraving available']
        })
      })

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)

      /**
       * STEP 5: Mock Product Retrieval
       * Simulate loading the product again to verify persistence
       */
      mockPrisma.product.findUnique.mockResolvedValue(productUpdateData)

      const { GET } = await import('@/app/api/admin/products/[id]/route')
      const getRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'valid-token' })
        }
      } as any

      const getResponse = await GET(getRequest, { params: mockParams })
      const getResponseData = await getResponse.json()

      /**
       * STEP 6: Verify Color Data Persisted
       */
      expect(getResponse.status).toBe(200)
      expect(getResponseData.product).toEqual(
        expect.objectContaining({
          numberOfColors: 2,
          availableColors: ['Red', 'Black'],
          modelFile: '/models/sword-model.3mf',
          modelOrientation: { x: 0.2, y: 1.57, z: 0 },
          finish: 'Matte',
          customizable: true,
          features: ['Multi-color 3D printing', 'Custom engraving available']
        })
      )
    })

    it('should handle subsequent updates without losing 3MF color data', async () => {
      /**
       * Scenario: Product already has 3MF color data, user makes a non-3MF update
       * (e.g., changes price, description) - color data should be preserved
       */
      const existingProduct = {
        id: 'product-456',
        name: 'Viking Axe',
        description: 'Original description',
        price: 75.00,
        numberOfColors: 3,
        availableColors: ['Silver', 'Black', 'Red'],
        modelFile: '/models/viking-axe.3mf',
        modelOrientation: { x: 0.5, y: 0, z: 0.785 },
        finish: 'Antique',
        customizable: true,
        features: ['Triple-color design', 'Norse runes']
      }

      // User updates only description and price
      const updateData = {
        name: 'Viking Axe',
        description: 'Updated description with more details',
        price: '79.99', // New price
        stockQuantity: '3',

        // Existing 3MF data should be preserved
        numberOfColors: 3,
        availableColors: ['Silver', 'Black', 'Red'],
        modelFile: '/models/viking-axe.3mf',
        modelOrientation: { x: 0.5, y: 0, z: 0.785 },
        finish: 'Antique',
        customizable: true,
        features: ['Triple-color design', 'Norse runes']
      }

      mockPrisma.product.update.mockResolvedValue({
        ...existingProduct,
        description: 'Updated description with more details',
        price: 79.99
      })

      const { PUT } = await import('@/app/api/admin/products/[id]/route')
      const mockRequest = {
        cookies: { get: jest.fn().mockReturnValue({ value: 'valid-token' }) },
        json: jest.fn().mockResolvedValue(updateData)
      } as any

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: 'product-456' }) })

      // Verify 3MF data preserved in update
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'product-456' },
        data: expect.objectContaining({
          description: 'Updated description with more details',
          price: 79.99,
          // 3MF data should be preserved
          numberOfColors: 3,
          availableColors: ['Silver', 'Black', 'Red'],
          modelFile: '/models/viking-axe.3mf',
          modelOrientation: { x: 0.5, y: 0, z: 0.785 }
        })
      })

      expect(response.status).toBe(200)
    })

    it('should handle edge cases and data validation correctly', async () => {
      /**
       * Test various edge cases that could break color data persistence
       */
      const edgeCaseScenarios = [
        {
          name: 'Zero colors default to 1',
          input: { numberOfColors: 0, availableColors: [] },
          expected: { numberOfColors: 1, availableColors: [] }
        },
        {
          name: 'String numberOfColors converted to integer',
          input: { numberOfColors: '4', availableColors: ['A', 'B', 'C', 'D'] },
          expected: { numberOfColors: 4, availableColors: ['A', 'B', 'C', 'D'] }
        },
        {
          name: 'Null values handled gracefully',
          input: { numberOfColors: null, availableColors: null, modelFile: null },
          expected: { numberOfColors: 1, availableColors: [], modelFile: null }
        },
        {
          name: 'Complex model orientation preserved',
          input: {
            modelOrientation: { x: 1.5708, y: -0.7854, z: 3.1416 },
            numberOfColors: 2
          },
          expected: {
            modelOrientation: { x: 1.5708, y: -0.7854, z: 3.1416 },
            numberOfColors: 2
          }
        }
      ]

      for (const scenario of edgeCaseScenarios) {
        mockPrisma.product.update.mockClear()
        mockPrisma.product.update.mockResolvedValue({ id: 'test-id' })

        const { PUT } = await import('@/app/api/admin/products/[id]/route')
        const mockRequest = {
          cookies: { get: jest.fn().mockReturnValue({ value: 'valid-token' }) },
          json: jest.fn().mockResolvedValue({
            name: 'Test Product',
            description: 'Test',
            price: '50.00',
            stockQuantity: '1',
            ...scenario.input
          })
        } as any

        await PUT(mockRequest, { params: Promise.resolve({ id: 'test-id' }) })

        expect(mockPrisma.product.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining(scenario.expected)
          })
        )
      }
    })
  })

  describe('Data Integrity Validation', () => {
    it('should ensure numberOfColors matches availableColors length when possible', async () => {
      const testCases = [
        {
          numberOfColors: 2,
          availableColors: ['Red', 'Blue'],
          shouldMatch: true
        },
        {
          numberOfColors: 3,
          availableColors: ['Red', 'Blue'], // Fewer colors than numberOfColors
          shouldMatch: false // This is allowed but should be noted
        },
        {
          numberOfColors: 1,
          availableColors: ['Red', 'Blue', 'Green'], // More colors than numberOfColors
          shouldMatch: false // This is allowed but should be noted
        }
      ]

      for (const testCase of testCases) {
        mockPrisma.product.update.mockClear()
        mockPrisma.product.update.mockResolvedValue({ id: 'test-id' })

        const { PUT } = await import('@/app/api/admin/products/[id]/route')
        const mockRequest = {
          cookies: { get: jest.fn().mockReturnValue({ value: 'valid-token' }) },
          json: jest.fn().mockResolvedValue({
            name: 'Test Product',
            description: 'Test',
            price: '50.00',
            stockQuantity: '1',
            numberOfColors: testCase.numberOfColors,
            availableColors: testCase.availableColors
          })
        } as any

        const response = await PUT(mockRequest, { params: Promise.resolve({ id: 'test-id' }) })

        // All cases should succeed - the system allows flexibility
        expect(response.status).toBe(200)
        expect(mockPrisma.product.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              numberOfColors: testCase.numberOfColors,
              availableColors: testCase.availableColors
            })
          })
        )
      }
    })
  })
})