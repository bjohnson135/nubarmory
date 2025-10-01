/**
 * Tests for Admin Edit Product Form - 3MF Color Data Handling
 *
 * This test suite validates that:
 * 1. Form correctly initializes with existing product data
 * 2. 3MF upload triggers analysis and updates form state
 * 3. Color selection and numberOfColors persist through form updates
 * 4. Form submission sends all required fields
 * 5. Form state management handles edge cases
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock the EditProduct component's dependencies
jest.mock('@/components/ModelViewer', () => {
  return function MockModelViewer({ modelUrl, selectedColors, width, height, initialRotation }: any) {
    return (
      <div data-testid="model-viewer">
        <span>ModelViewer: {modelUrl}</span>
        <span>Colors: {selectedColors.join(', ')}</span>
        <span>Rotation: {JSON.stringify(initialRotation)}</span>
      </div>
    )
  }
})

// Import after mocking
const EditProduct = require('@/app/admin/products/edit/[id]/page').default

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('EditProduct Form - 3MF Color Data Handling', () => {
  const mockProductData = {
    id: 'test-product-id',
    name: 'Test Sword',
    description: 'A test sword',
    price: 99.99,
    category: 'premium',
    images: ['https://example.com/image.jpg'],
    stockQuantity: 10,
    lowStockThreshold: 2,
    manufacturingTime: '2-3 weeks',
    weightOz: 5.5,
    lengthIn: 12,
    widthIn: 3,
    heightIn: 1,
    inStock: true,
    materialId: 'material-123',
    numberOfColors: 2,
    availableColors: ['Red', 'Blue'],
    modelFile: '/models/test.stl',
    modelOrientation: { x: 0.5, y: 1.0, z: 0 },
    finish: 'Matte Black',
    customizable: true,
    features: ['Custom engraving', 'Multiple colors']
  }

  const mockMaterials = [
    { id: 'material-123', name: 'PLA', displayName: 'PLA (Standard)', description: 'Standard PLA' },
    { id: 'material-456', name: 'ABS', displayName: 'ABS (Durable)', description: 'Durable ABS' }
  ]

  const mockColors = [
    { id: 'color-1', name: 'Red', displayName: 'Red', hexCode: '#FF0000', isSpecial: false },
    { id: 'color-2', name: 'Blue', displayName: 'Blue', hexCode: '#0000FF', isSpecial: false },
    { id: 'color-3', name: 'Green', displayName: 'Green', hexCode: '#00FF00', isSpecial: false }
  ]

  const mock3MFAnalysis = {
    success: true,
    analysis: {
      filename: 'test-model.3mf',
      fileSize: 1024000,
      materials: [
        { id: '1', name: 'Material 1', displayColor: '#FF0000' },
        { id: '2', name: 'Material 2', displayColor: '#0000FF' }
      ]
    },
    summary: {
      totalMeshes: 2,
      colorZones: 2,
      supportsMultiColor: true
    },
    recommendations: {
      numberOfColors: 2,
      reason: 'This 3MF has 2 mesh(es) and 2 color zone(s), supporting multi-color printing'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful auth
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/admin/me')) {
        return Promise.resolve({ ok: true })
      }
      if (url.includes('/api/materials') && !url.includes('/colors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ materials: mockMaterials })
        })
      }
      if (url.includes('/materials/') && url.includes('/colors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ colors: mockColors })
        })
      }
      if (url.includes('/api/admin/products/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ product: mockProductData })
        })
      }
      return Promise.resolve({ ok: true })
    })
  })

  describe('Form Initialization with 3MF Data', () => {
    it('should initialize form with existing product color data', async () => {
      render(<EditProduct />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/products/test-product-id')
      })

      // Check that numberOfColors field is populated
      await waitFor(() => {
        const numberOfColorsSelect = screen.getByDisplayValue('Two Colors')
        expect(numberOfColorsSelect).toBeInTheDocument()
      })

      // Check that finish field is populated
      await waitFor(() => {
        const finishField = screen.getByDisplayValue('Matte Black')
        expect(finishField).toBeInTheDocument()
      })
    })

    it('should load available colors for the selected material', async () => {
      render(<EditProduct />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/materials/material-123/colors')
      })

      // Should show color checkboxes
      await waitFor(() => {
        expect(screen.getByText('Red')).toBeInTheDocument()
        expect(screen.getByText('Blue')).toBeInTheDocument()
      })
    })
  })

  describe('3MF File Upload and Analysis', () => {
    it('should trigger 3MF analysis when 3MF file is uploaded', async () => {
      // Mock file upload response
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/upload-model')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ modelUrl: '/models/test-model.3mf' })
          })
        }
        if (url.includes('/api/analyze-3mf')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mock3MFAnalysis)
          })
        }
        // Default mocks for other calls
        if (url.includes('/api/admin/me')) return Promise.resolve({ ok: true })
        if (url.includes('/api/materials')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ materials: mockMaterials })
        })
        if (url.includes('/api/admin/products/')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ product: mockProductData })
        })
        return Promise.resolve({ ok: true })
      })

      render(<EditProduct />)

      await waitFor(() => {
        expect(screen.getByText('Upload 3D Model')).toBeInTheDocument()
      })

      // Simulate file upload
      const fileInput = document.querySelector('input[type="file"][accept=".stl,.STL,.3mf,.3MF"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()

      const mockFile = new File(['mock 3mf content'], 'test-model.3mf', { type: 'application/octet-stream' })
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      })

      fireEvent.change(fileInput)

      // Should call upload-model API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/upload-model', expect.objectContaining({
          method: 'POST'
        }))
      })

      // Should call analyze-3mf API for 3MF files
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/analyze-3mf', expect.objectContaining({
          method: 'POST'
        }))
      })
    })

    it('should update numberOfColors based on 3MF analysis', async () => {
      // Set up mocks for 3MF workflow
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/upload-model')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ modelUrl: '/models/test-model.3mf' })
          })
        }
        if (url.includes('/api/analyze-3mf')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mock3MFAnalysis)
          })
        }
        // Default auth and data mocks
        if (url.includes('/api/admin/me')) return Promise.resolve({ ok: true })
        if (url.includes('/api/materials')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ materials: mockMaterials })
        })
        if (url.includes('/api/admin/products/')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ product: { ...mockProductData, numberOfColors: 1 } })
        })
        return Promise.resolve({ ok: true })
      })

      render(<EditProduct />)

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Single Color')).toBeInTheDocument()
      })

      // Simulate 3MF file upload
      const fileInput = document.querySelector('input[type="file"][accept=".stl,.STL,.3mf,.3MF"]') as HTMLInputElement
      const mockFile = new File(['mock 3mf content'], 'test-model.3mf', { type: 'application/octet-stream' })
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      })

      fireEvent.change(fileInput)

      // Should update numberOfColors based on analysis
      await waitFor(() => {
        expect(screen.getByDisplayValue('Two Colors')).toBeInTheDocument()
      })
    })

    it('should display 3MF analysis information', async () => {
      // Mock for displaying analysis
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/upload-model')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ modelUrl: '/models/test-model.3mf' })
          })
        }
        if (url.includes('/api/analyze-3mf')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mock3MFAnalysis)
          })
        }
        if (url.includes('/api/admin/me')) return Promise.resolve({ ok: true })
        if (url.includes('/api/materials')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ materials: mockMaterials })
        })
        if (url.includes('/api/admin/products/')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ product: mockProductData })
        })
        return Promise.resolve({ ok: true })
      })

      render(<EditProduct />)

      // Simulate 3MF upload
      const fileInput = document.querySelector('input[type="file"][accept=".stl,.STL,.3mf,.3MF"]') as HTMLInputElement
      const mockFile = new File(['mock 3mf content'], 'test-model.3mf', { type: 'application/octet-stream' })
      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false
      })

      fireEvent.change(fileInput)

      // Should display analysis panel
      await waitFor(() => {
        expect(screen.getByText('3MF File Analysis')).toBeInTheDocument()
        expect(screen.getByText('test-model.3mf')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // Color zones
        expect(screen.getByText('Yes')).toBeInTheDocument() // Multi-color support
      })
    })
  })

  describe('Form Submission with Color Data', () => {
    it('should submit all form fields including color data', async () => {
      let submittedData: any = null

      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/api/admin/products/test-product-id') && options?.method === 'PUT') {
          submittedData = JSON.parse(options.body)
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, product: mockProductData })
          })
        }
        // Default mocks
        if (url.includes('/api/admin/me')) return Promise.resolve({ ok: true })
        if (url.includes('/api/materials')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ materials: mockMaterials })
        })
        if (url.includes('/api/admin/products/')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ product: mockProductData })
        })
        return Promise.resolve({ ok: true })
      })

      render(<EditProduct />)

      await waitFor(() => {
        expect(screen.getByText('Update Product')).toBeInTheDocument()
      })

      // Submit the form
      const submitButton = screen.getByText('Update Product')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(submittedData).toBeTruthy()
      })

      // Verify all critical fields are included
      expect(submittedData).toEqual(
        expect.objectContaining({
          name: 'Test Sword',
          description: 'A test sword',
          price: '99.99',
          numberOfColors: 2,
          availableColors: ['Red', 'Blue'],
          modelFile: '/models/test.stl',
          modelOrientation: { x: 0.5, y: 1.0, z: 0 },
          finish: 'Matte Black',
          customizable: true,
          features: ['Custom engraving', 'Multiple colors']
        })
      )
    })

    it('should handle color selection changes', async () => {
      render(<EditProduct />)

      await waitFor(() => {
        expect(screen.getByText('Red')).toBeInTheDocument()
      })

      // Find and click a color checkbox
      const greenColorCheckbox = screen.getByRole('checkbox', { name: /green/i })
      fireEvent.click(greenColorCheckbox)

      // Should update the selected colors
      await waitFor(() => {
        expect(greenColorCheckbox).toBeChecked()
      })
    })
  })

  describe('Form State Management Edge Cases', () => {
    it('should handle missing optional fields gracefully', async () => {
      const minimalProductData = {
        ...mockProductData,
        modelFile: null,
        modelOrientation: null,
        finish: null,
        customizable: false,
        features: [],
        availableColors: []
      }

      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/api/admin/products/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ product: minimalProductData })
          })
        }
        if (url.includes('/api/admin/me')) return Promise.resolve({ ok: true })
        if (url.includes('/api/materials')) return Promise.resolve({
          ok: true, json: () => Promise.resolve({ materials: mockMaterials })
        })
        return Promise.resolve({ ok: true })
      })

      render(<EditProduct />)

      // Should not crash and should have default values
      await waitFor(() => {
        expect(screen.getByDisplayValue('Standard')).toBeInTheDocument() // Default finish
        expect(screen.getByDisplayValue('Single Color')).toBeInTheDocument() // Default numberOfColors
      })
    })

    it('should handle material change and reset available colors', async () => {
      render(<EditProduct />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('PLA (Standard)')).toBeInTheDocument()
      })

      // Change material
      const materialSelect = screen.getByDisplayValue('PLA (Standard)')
      fireEvent.change(materialSelect, { target: { value: 'material-456' } })

      // Should call colors API for new material
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/materials/material-456/colors')
      })
    })
  })
})