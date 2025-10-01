/**
 * Tests for 3MF Analysis API Integration
 *
 * This test suite validates that:
 * 1. 3MF analysis correctly identifies color zones and materials
 * 2. Analysis provides accurate recommendations for numberOfColors
 * 3. File validation and error handling works correctly
 * 4. Analysis output structure is consistent and reliable
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/analyze-3mf/route'
import JSZip from 'jszip'

// Mock JSZip
jest.mock('jszip')
const MockJSZip = JSZip as jest.MockedClass<typeof JSZip>

// Mock xmldom
const mockDOMParser = {
  parseFromString: jest.fn()
}
jest.mock('xmldom', () => ({
  DOMParser: jest.fn(() => mockDOMParser)
}))

describe('3MF Analysis API Integration', () => {
  let mockZipInstance: any
  let mockModelFile: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockModelFile = {
      async: jest.fn()
    }

    mockZipInstance = {
      loadAsync: jest.fn(),
      file: jest.fn().mockReturnValue(mockModelFile)
    }

    MockJSZip.mockImplementation(() => mockZipInstance)
  })

  const createMockRequest = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    return {
      formData: jest.fn().mockResolvedValue(formData)
    } as unknown as NextRequest
  }

  const createMockXMLDocument = (xmlContent: string) => {
    const mockDoc = {
      documentElement: {},
      getElementsByTagName: jest.fn()
    }

    mockDOMParser.parseFromString.mockReturnValue(mockDoc)
    mockModelFile.async.mockResolvedValue(xmlContent)

    return mockDoc
  }

  describe('Single Color 3MF Analysis', () => {
    it('should correctly identify single-color 3MF files', async () => {
      const mockFile = new File(['mock content'], 'single-color.3mf', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      // Mock XML structure for single color
      const mockDoc = createMockXMLDocument('<model></model>')

      // Mock resources with no materials/colors
      const mockResources = { getElementsByTagName: jest.fn().mockReturnValue([]) }
      mockDoc.getElementsByTagName.mockImplementation((tagName: string) => {
        if (tagName === 'resources') return [mockResources]
        if (tagName === 'build') return [{}]
        return []
      })

      mockZipInstance.loadAsync.mockResolvedValue(true)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.recommendations.numberOfColors).toBe(0)
      expect(responseData.summary.supportsMultiColor).toBe(false)
      expect(responseData.recommendations.reason).toContain('single-color only')
    })
  })

  describe('Multi-Color 3MF Analysis', () => {
    it('should correctly identify multi-color 3MF files with materials', async () => {
      const mockFile = new File(['mock content'], 'multi-color.3mf', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      const mockDoc = createMockXMLDocument('<model></model>')

      // Mock materials
      const mockMaterial1 = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'id') return '1'
          if (attr === 'name') return 'Red Material'
          if (attr === 'displaycolor') return '#FF0000'
          return null
        })
      }
      const mockMaterial2 = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'id') return '2'
          if (attr === 'name') return 'Blue Material'
          if (attr === 'displaycolor') return '#0000FF'
          return null
        })
      }

      // Mock object with triangles
      const mockTriangle1 = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'pid') return '1' // Material 1
          return null
        }),
        attributes: []
      }
      const mockTriangle2 = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'pid') return '2' // Material 2
          return null
        }),
        attributes: []
      }

      const mockObject = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'id') return 'obj1'
          if (attr === 'name') return 'Multi-Color Object'
          return null
        }),
        getElementsByTagName: jest.fn().mockImplementation((tagName: string) => {
          if (tagName === 'triangle') return [mockTriangle1, mockTriangle2]
          return []
        })
      }

      // Mock resources
      const mockResources = {
        getElementsByTagName: jest.fn().mockImplementation((tagName: string) => {
          if (tagName === 'basematerial') return [mockMaterial1, mockMaterial2]
          if (tagName === 'colorgroup') return []
          if (tagName === 'object') return [mockObject]
          return []
        })
      }

      mockDoc.getElementsByTagName.mockImplementation((tagName: string) => {
        if (tagName === 'resources') return [mockResources]
        if (tagName === 'build') return [{}]
        return []
      })

      mockZipInstance.loadAsync.mockResolvedValue(true)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.analysis.materials).toHaveLength(2)
      expect(responseData.analysis.materials[0].name).toBe('Red Material')
      expect(responseData.analysis.materials[1].name).toBe('Blue Material')
      expect(responseData.summary.colorZones).toBe(2)
      expect(responseData.summary.supportsMultiColor).toBe(true)
      expect(responseData.recommendations.numberOfColors).toBe(1) // One mesh with multiple materials
      expect(responseData.recommendations.reason).toContain('supporting multi-color printing')
    })

    it('should handle Bambu Studio paint colors', async () => {
      const mockFile = new File(['mock content'], 'bambu-colors.3mf', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      const mockDoc = createMockXMLDocument('<model></model>')

      // Mock triangles with paint_color attributes (Bambu Studio format)
      const mockTriangle1 = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'paint_color') return 'red'
          return null
        }),
        attributes: [{ name: 'paint_color' }]
      }
      const mockTriangle2 = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'paint_color') return 'blue'
          return null
        }),
        attributes: [{ name: 'paint_color' }]
      }
      const mockTriangle3 = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          return null // No paint_color = default color
        }),
        attributes: []
      }

      const mockObject = {
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'id') return 'bambu_obj'
          if (attr === 'name') return 'Bambu Object'
          return null
        }),
        getElementsByTagName: jest.fn().mockImplementation((tagName: string) => {
          if (tagName === 'triangle') return [mockTriangle1, mockTriangle2, mockTriangle3]
          return []
        })
      }

      const mockResources = {
        getElementsByTagName: jest.fn().mockImplementation((tagName: string) => {
          if (tagName === 'basematerial') return []
          if (tagName === 'colorgroup') return []
          if (tagName === 'object') return [mockObject]
          return []
        })
      }

      mockDoc.getElementsByTagName.mockImplementation((tagName: string) => {
        if (tagName === 'resources') return [mockResources]
        if (tagName === 'build') return [{}]
        return []
      })

      mockZipInstance.loadAsync.mockResolvedValue(true)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.analysis.objects[0].paintColors).toEqual(['red', 'blue', 'default'])
      expect(responseData.analysis.objects[0].totalColors).toBe(3)
      expect(responseData.summary.colorZones).toBe(3)
      expect(responseData.summary.supportsMultiColor).toBe(true)
    })
  })

  describe('File Validation and Error Handling', () => {
    it('should reject non-3MF files', async () => {
      const mockFile = new File(['mock content'], 'model.stl', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('File must be a 3MF file')
    })

    it('should handle missing file', async () => {
      const request = {
        formData: jest.fn().mockResolvedValue(new FormData())
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('No file provided')
    })

    it('should handle invalid 3MF structure', async () => {
      const mockFile = new File(['mock content'], 'invalid.3mf', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      mockZipInstance.loadAsync.mockResolvedValue(true)
      mockZipInstance.file.mockReturnValue(null) // No 3dmodel.model file

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid 3MF file - missing 3dmodel.model')
    })

    it('should handle ZIP parsing errors', async () => {
      const mockFile = new File(['mock content'], 'corrupt.3mf', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      mockZipInstance.loadAsync.mockRejectedValue(new Error('Corrupt ZIP file'))

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Failed to analyze 3MF file')
    })

    it('should handle XML parsing errors', async () => {
      const mockFile = new File(['mock content'], 'bad-xml.3mf', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      mockZipInstance.loadAsync.mockResolvedValue(true)
      mockModelFile.async.mockResolvedValue('invalid xml content')
      mockDOMParser.parseFromString.mockReturnValue(null) // Invalid XML

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Invalid XML in 3MF file')
    })
  })

  describe('Analysis Output Structure Validation', () => {
    it('should provide consistent analysis structure', async () => {
      const mockFile = new File(['mock content'], 'test.3mf', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      const mockDoc = createMockXMLDocument('<model></model>')
      const mockResources = { getElementsByTagName: jest.fn().mockReturnValue([]) }
      mockDoc.getElementsByTagName.mockImplementation((tagName: string) => {
        if (tagName === 'resources') return [mockResources]
        if (tagName === 'build') return [{}]
        return []
      })

      mockZipInstance.loadAsync.mockResolvedValue(true)

      const response = await POST(request)
      const responseData = await response.json()

      // Verify required top-level structure
      expect(responseData).toHaveProperty('success')
      expect(responseData).toHaveProperty('analysis')
      expect(responseData).toHaveProperty('summary')
      expect(responseData).toHaveProperty('recommendations')

      // Verify analysis structure
      expect(responseData.analysis).toHaveProperty('filename')
      expect(responseData.analysis).toHaveProperty('fileSize')
      expect(responseData.analysis).toHaveProperty('materials')
      expect(responseData.analysis).toHaveProperty('objects')
      expect(responseData.analysis).toHaveProperty('meshes')
      expect(responseData.analysis).toHaveProperty('colorZones')
      expect(responseData.analysis).toHaveProperty('hasMaterials')
      expect(responseData.analysis).toHaveProperty('hasColors')

      // Verify summary structure
      expect(responseData.summary).toHaveProperty('totalMaterials')
      expect(responseData.summary).toHaveProperty('totalObjects')
      expect(responseData.summary).toHaveProperty('totalMeshes')
      expect(responseData.summary).toHaveProperty('colorZones')
      expect(responseData.summary).toHaveProperty('supportsMultiColor')
      expect(responseData.summary).toHaveProperty('recommendedColors')

      // Verify recommendations structure
      expect(responseData.recommendations).toHaveProperty('numberOfColors')
      expect(responseData.recommendations).toHaveProperty('reason')

      // Verify data types
      expect(typeof responseData.analysis.colorZones).toBe('number')
      expect(typeof responseData.summary.supportsMultiColor).toBe('boolean')
      expect(typeof responseData.recommendations.numberOfColors).toBe('number')
      expect(Array.isArray(responseData.analysis.materials)).toBe(true)
      expect(Array.isArray(responseData.analysis.objects)).toBe(true)
    })

    it('should cap recommended colors at 4', async () => {
      const mockFile = new File(['mock content'], 'many-colors.3mf', { type: 'application/octet-stream' })
      const request = createMockRequest(mockFile)

      const mockDoc = createMockXMLDocument('<model></model>')

      // Create many objects to test the 4-color cap
      const mockObjects = Array.from({ length: 8 }, (_, i) => ({
        getAttribute: jest.fn().mockImplementation((attr: string) => {
          if (attr === 'id') return `obj${i}`
          if (attr === 'name') return `Object ${i}`
          return null
        }),
        getElementsByTagName: jest.fn().mockImplementation((tagName: string) => {
          if (tagName === 'triangle') return [{ getAttribute: () => null, attributes: [] }]
          return []
        })
      }))

      const mockResources = {
        getElementsByTagName: jest.fn().mockImplementation((tagName: string) => {
          if (tagName === 'basematerial') return []
          if (tagName === 'colorgroup') return []
          if (tagName === 'object') return mockObjects
          return []
        })
      }

      mockDoc.getElementsByTagName.mockImplementation((tagName: string) => {
        if (tagName === 'resources') return [mockResources]
        if (tagName === 'build') return [{}]
        return []
      })

      mockZipInstance.loadAsync.mockResolvedValue(true)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.summary.recommendedColors).toBe(4) // Should be capped at 4
      expect(responseData.recommendations.numberOfColors).toBe(4)
    })
  })
})