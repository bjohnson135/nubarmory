'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Shield, ArrowLeft, Save, Upload, Palette, Plus, X, RotateCcw } from 'lucide-react'
import ModelViewer from '@/components/ModelViewer'

interface Material {
  id: string
  name: string
  displayName: string
  description: string | null
}

interface Color {
  id: string
  name: string
  displayName: string
  hexCode: string
  description: string | null
  isSpecial: boolean
  isDefault?: boolean
  priceModifier?: number
}

export default function EditProduct() {
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [modelUploading, setModelUploading] = useState(false)
  const [productId, setProductId] = useState<string>('')
  const [materials, setMaterials] = useState<Material[]>([])
  const [availableColors, setAvailableColors] = useState<Color[]>([])
  const [modelAnalysis, setModelAnalysis] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Premium',
    image: '',
    stockQuantity: '',
    lowStockThreshold: '5',
    manufacturingTime: '',
    weightOz: '',
    lengthIn: '',
    widthIn: '',
    heightIn: '',
    inStock: true,
    material: '',
    numberOfColors: 1,
    availableColors: [] as string[],
    modelFile: '',
    modelOrientation: { x: 0, y: 0, z: 0 },
    finish: 'Standard',
    customizable: false,
    features: [] as string[]
  })
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    if (params.id) {
      setProductId(params.id as string)
      checkAuth()
      loadMaterials()
    }
  }, [params.id])

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  useEffect(() => {
    if (formData.material) {
      loadColorsForMaterial(formData.material)
    }
  }, [formData.material])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me')
      if (!response.ok) {
        router.push('/admin/login')
      }
    } catch (error) {
      router.push('/admin/login')
    }
  }

  const loadMaterials = async () => {
    try {
      const response = await fetch('/api/materials')
      if (response.ok) {
        const data = await response.json()
        setMaterials(data.materials || [])
        if (data.materials?.length > 0 && !formData.material) {
          setFormData(prev => ({ ...prev, material: data.materials[0].id }))
        }
      }
    } catch (error) {
      console.error('Error loading materials:', error)
    }
  }

  const loadColorsForMaterial = async (materialId: string) => {
    try {
      const response = await fetch(`/api/materials/${materialId}/colors`)
      if (response.ok) {
        const data = await response.json()
        setAvailableColors(data.colors || [])

        const defaultColors = data.colors?.filter((c: Color) => c.isDefault)?.slice(0, 3)?.map((c: Color) => c.name) || []
        if (defaultColors.length > 0) {
          setFormData(prev => ({
            ...prev,
            availableColors: defaultColors
          }))
        }
      }
    } catch (error) {
      console.error('Error loading colors for material:', error)
    }
  }

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        const product = data.product
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '',
          stockQuantity: (product.stockQuantity || 0).toString(),
          lowStockThreshold: (product.lowStockThreshold || 5).toString(),
          manufacturingTime: product.manufacturingTime || '',
          weightOz: (product.weightOz || '').toString(),
          lengthIn: (product.lengthIn || '').toString(),
          widthIn: (product.widthIn || '').toString(),
          heightIn: (product.heightIn || '').toString(),
          inStock: product.inStock,
          material: product.materialId || (materials.length > 0 ? materials[0].id : ''),
          numberOfColors: product.numberOfColors || 1,
          availableColors: product.availableColors || [],
          modelFile: product.modelFile || '',
          modelOrientation: product.modelOrientation || { x: 0, y: 0, z: 0 },
          finish: product.finish || 'Standard',
          customizable: product.customizable || false,
          features: product.features || []
        })
      } else {
        alert('Product not found')
        router.push('/admin/dashboard')
      }
    } catch (error) {
      console.error('Error loading product:', error)
      router.push('/admin/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Product updated successfully:', data.product)
        router.push('/admin/dashboard')
      } else {
        alert(data.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('An error occurred while updating the product')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          image: data.imageUrl
        }))
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setImageUploading(false)
    }
  }

  const handleModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setModelUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-model', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          modelFile: data.modelUrl
        }))

        // Analyze 3MF files for diagnostic information
        const fileName = file.name.toLowerCase()
        if (fileName.endsWith('.3mf')) {
          console.log('Admin Edit: Analyzing 3MF file:', fileName)
          try {
            const analysisFormData = new FormData()
            analysisFormData.append('file', file)

            console.log('Admin Edit: Sending analysis request to /api/analyze-3mf')
            const analysisResponse = await fetch('/api/analyze-3mf', {
              method: 'POST',
              body: analysisFormData
            })

            console.log('Admin Edit: Analysis response status:', analysisResponse.status)
            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json()
              console.log('Admin Edit: Analysis data received:', analysisData)
              setModelAnalysis(analysisData)

              // Auto-suggest number of colors based on analysis
              if (analysisData.recommendations?.numberOfColors) {
                console.log('Admin Edit: Auto-setting number of colors to:', analysisData.recommendations.numberOfColors)
                setFormData(prev => ({
                  ...prev,
                  numberOfColors: analysisData.recommendations.numberOfColors
                }))
              }
            } else {
              const errorData = await analysisResponse.text()
              console.error('Admin Edit: Analysis API error:', analysisResponse.status, errorData)
            }
          } catch (error) {
            console.error('3MF analysis error:', error)
            // Don't fail the upload if analysis fails
          }
        } else {
          // Clear analysis for non-3MF files
          setModelAnalysis(null)
        }
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload 3D model')
    } finally {
      setModelUploading(false)
    }
  }

  const handleOrientationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setFormData(prev => ({
      ...prev,
      modelOrientation: {
        ...prev.modelOrientation,
        [axis]: value
      }
    }))
  }

  const resetOrientation = () => {
    setFormData(prev => ({
      ...prev,
      modelOrientation: { x: 0, y: 0, z: 0 }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="inline-flex items-center mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <Shield className="h-8 w-8 text-yellow-600 mr-3" />
            <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter product description"
                />
              </div>

              {/* Price and Category Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  >
                    <option value="Premium">Premium</option>
                    <option value="Standard">Standard</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg or upload a file"
                  />
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('imageFile')?.click()}
                    disabled={imageUploading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {imageUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </button>
                </div>
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = `https://placehold.co/200x200/f3f4f6/9ca3af?text=No+Image`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 3D Model Upload */}
              <div>
                <label htmlFor="modelFile" className="block text-sm font-medium text-gray-700 mb-2">
                  3D Model File (STL/3MF)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="modelFile"
                    name="modelFile"
                    value={formData.modelFile || ''}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="Upload an STL file for 3D visualization"
                    readOnly
                  />
                  <input
                    type="file"
                    id="modelFileInput"
                    accept=".stl,.STL,.3mf,.3MF"
                    onChange={handleModelUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('modelFileInput')?.click()}
                    disabled={modelUploading}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {modelUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload 3D Model
                      </>
                    )}
                  </button>
                </div>
                {formData.modelFile && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <div className="text-green-600 mr-2">📦</div>
                      <span className="text-sm text-green-700">
                        3D Model: {formData.modelFile.split('/').pop()}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Upload an STL or 3MF file for 3D model visualization. 3MF files provide color information. Max file size: 50MB
                </p>
                {formData.modelFile && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">3D Model Preview</h4>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 flex justify-center">
                      <div className="w-[400px] h-[300px] overflow-hidden">
                        <ModelViewer
                          modelUrl={formData.modelFile}
                          selectedColors={['#888888']}
                          width={400}
                          height={300}
                          initialRotation={formData.modelOrientation}
                          className="border border-gray-200 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3MF Analysis Panel */}
                {modelAnalysis && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">3MF File Analysis</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Filename:</span>
                          <span className="ml-2 text-blue-700">{modelAnalysis.analysis?.filename}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">File Size:</span>
                          <span className="ml-2 text-blue-700">{Math.round(modelAnalysis.analysis?.fileSize / 1024)} KB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Meshes:</span>
                          <span className="ml-2 text-blue-700">{modelAnalysis.summary?.totalMeshes || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color Zones:</span>
                          <span className="ml-2 text-blue-700">{modelAnalysis.summary?.colorZones || 0}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-blue-200 text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">Recommendation:</span> {modelAnalysis.recommendations?.reason}
                        </div>
                        <div className="text-gray-600 mt-1">
                          Suggested number of colors: {modelAnalysis.recommendations?.numberOfColors || 1}
                        </div>
                      </div>

                      {modelAnalysis.analysis?.materials?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-sm text-gray-600 mb-2">Materials found:</div>
                          <div className="flex flex-wrap gap-2">
                            {modelAnalysis.analysis.materials.slice(0, 4).map((material: any, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {material.name}
                              </span>
                            ))}
                          </div>
                          {modelAnalysis.analysis.materials.length > 4 && (
                            <div className="text-xs text-gray-500 mt-1">
                              ...and {modelAnalysis.analysis.materials.length - 4} more
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-blue-200 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Multi-Color Support:</span>
                          <span className={`ml-2 font-medium ${
                            modelAnalysis.summary?.supportsMultiColor
                              ? 'text-green-700'
                              : 'text-amber-700'
                          }`}>
                            {modelAnalysis.summary?.supportsMultiColor ? 'Yes' : 'Single color only'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Orientation Controls */}
                {formData.modelFile && (
                  <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="text-sm font-medium text-orange-900 mb-3 flex items-center">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Model Orientation
                    </h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Preview */}
                      <div>
                        <p className="text-sm text-orange-700 mb-3">Preview</p>
                        <ModelViewer
                          modelUrl={formData.modelFile}
                          selectedColors={['#888888']}
                          width={250}
                          height={200}
                          initialRotation={formData.modelOrientation}
                          className="border border-orange-300 rounded"
                        />
                      </div>

                      {/* Controls */}
                      <div className="space-y-4">
                        <p className="text-sm text-orange-700 mb-3">Adjust the initial viewing angle</p>

                        {/* X Rotation */}
                        <div>
                          <label className="block text-xs font-medium text-orange-800 mb-1">
                            X-axis (Pitch)
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min={-180}
                              max={180}
                              step={1}
                              value={Math.round((formData.modelOrientation.x * 180) / Math.PI)}
                              onChange={(e) => handleOrientationChange('x', (parseFloat(e.target.value) * Math.PI) / 180)}
                              className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                              type="number"
                              min={-180}
                              max={180}
                              step={1}
                              value={Math.round((formData.modelOrientation.x * 180) / Math.PI)}
                              onChange={(e) => handleOrientationChange('x', (parseFloat(e.target.value) * Math.PI) / 180)}
                              className="w-16 px-2 py-1 text-xs border border-orange-300 rounded"
                            />
                            <span className="text-xs text-orange-700">°</span>
                          </div>
                        </div>

                        {/* Y Rotation */}
                        <div>
                          <label className="block text-xs font-medium text-orange-800 mb-1">
                            Y-axis (Yaw)
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min={-180}
                              max={180}
                              step={1}
                              value={Math.round((formData.modelOrientation.y * 180) / Math.PI)}
                              onChange={(e) => handleOrientationChange('y', (parseFloat(e.target.value) * Math.PI) / 180)}
                              className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                              type="number"
                              min={-180}
                              max={180}
                              step={1}
                              value={Math.round((formData.modelOrientation.y * 180) / Math.PI)}
                              onChange={(e) => handleOrientationChange('y', (parseFloat(e.target.value) * Math.PI) / 180)}
                              className="w-16 px-2 py-1 text-xs border border-orange-300 rounded"
                            />
                            <span className="text-xs text-orange-700">°</span>
                          </div>
                        </div>

                        {/* Z Rotation */}
                        <div>
                          <label className="block text-xs font-medium text-orange-800 mb-1">
                            Z-axis (Roll)
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="range"
                              min={-180}
                              max={180}
                              step={1}
                              value={Math.round((formData.modelOrientation.z * 180) / Math.PI)}
                              onChange={(e) => handleOrientationChange('z', (parseFloat(e.target.value) * Math.PI) / 180)}
                              className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                              type="number"
                              min={-180}
                              max={180}
                              step={1}
                              value={Math.round((formData.modelOrientation.z * 180) / Math.PI)}
                              onChange={(e) => handleOrientationChange('z', (parseFloat(e.target.value) * Math.PI) / 180)}
                              className="w-16 px-2 py-1 text-xs border border-orange-300 rounded"
                            />
                            <span className="text-xs text-orange-700">°</span>
                          </div>
                        </div>

                        {/* Reset Button */}
                        <button
                          type="button"
                          onClick={resetOrientation}
                          className="text-xs text-orange-600 hover:text-orange-800 flex items-center"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reset to Default
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    id="stockQuantity"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Current quantity in stock</p>
                </div>

                <div>
                  <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    id="lowStockThreshold"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="5"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this number</p>
                </div>
              </div>

              {/* Manufacturing Time for Out of Stock */}
              <div>
                <label htmlFor="manufacturingTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturing Time (when out of stock)
                </label>
                <input
                  type="text"
                  id="manufacturingTime"
                  name="manufacturingTime"
                  value={formData.manufacturingTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="e.g., 2-3 weeks, 5-7 business days"
                />
                <p className="text-xs text-gray-500 mt-1">Lead time shown to customers when item is out of stock</p>
              </div>

              {/* Shipping Dimensions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="weightOz" className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (oz)
                    </label>
                    <input
                      type="number"
                      id="weightOz"
                      name="weightOz"
                      value={formData.weightOz || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="4.0"
                    />
                  </div>
                  <div>
                    <label htmlFor="lengthIn" className="block text-sm font-medium text-gray-700 mb-2">
                      Length (in)
                    </label>
                    <input
                      type="number"
                      id="lengthIn"
                      name="lengthIn"
                      value={formData.lengthIn || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="8.0"
                    />
                  </div>
                  <div>
                    <label htmlFor="widthIn" className="block text-sm font-medium text-gray-700 mb-2">
                      Width (in)
                    </label>
                    <input
                      type="number"
                      id="widthIn"
                      name="widthIn"
                      value={formData.widthIn || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="3.0"
                    />
                  </div>
                  <div>
                    <label htmlFor="heightIn" className="block text-sm font-medium text-gray-700 mb-2">
                      Height (in)
                    </label>
                    <input
                      type="number"
                      id="heightIn"
                      name="heightIn"
                      value={formData.heightIn || ''}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="3.0"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Used for calculating accurate shipping costs. Leave blank to use defaults (4oz, 8"×3"×3")</p>
              </div>

              {/* Material and Color Customization */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Material & Color Options
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Material Selection */}
                  <div>
                    <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-2">
                      Print Material
                    </label>
                    <select
                      id="material"
                      name="material"
                      value={formData.material}
                      onChange={(e) => {
                        const newMaterial = e.target.value
                        setFormData(prev => ({
                          ...prev,
                          material: newMaterial,
                          availableColors: [] // Reset available colors when material changes
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      {materials.map(material => (
                        <option key={material.id} value={material.id}>{material.displayName}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Material type determines available colors</p>
                  </div>

                  {/* Number of Colors */}
                  <div>
                    <label htmlFor="numberOfColors" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Color Choices
                    </label>
                    <select
                      id="numberOfColors"
                      name="numberOfColors"
                      value={formData.numberOfColors}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfColors: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="1">Single Color</option>
                      <option value="2">Two Colors</option>
                      <option value="3">Three Colors</option>
                      <option value="4">Four Colors</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">How many colors customer can select</p>
                  </div>
                </div>

                {/* Available Colors Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Colors for {materials.find(m => m.id === formData.material)?.displayName || 'Selected Material'}
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {availableColors.map(color => (
                      <label
                        key={color.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg border border-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={formData.availableColors.includes(color.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                availableColors: [...prev.availableColors, color.name]
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                availableColors: prev.availableColors.filter(c => c !== color.name)
                              }))
                            }
                          }}
                          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        />
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-5 h-5 rounded border border-gray-300"
                            style={{ backgroundColor: color.hexCode }}
                          />
                          <span className="text-sm text-gray-700">{color.displayName}</span>
                          {color.isSpecial && (
                            <span className="text-xs text-yellow-600 font-medium">★</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {formData.availableColors.length} colors
                    {formData.availableColors.length === 0 && ' (select at least one)'}
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/admin/dashboard')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold rounded-md transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}