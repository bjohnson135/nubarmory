'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, Save, Upload, Palette, Box, RotateCcw } from 'lucide-react'
import ModelViewer from '@/components/ModelViewer'

export default function AddProduct() {
  const [loading, setLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [modelUploading, setModelUploading] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [availableColors, setAvailableColors] = useState<any[]>([])
  const [modelAnalysis, setModelAnalysis] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'premium',
    image: '',
    stockQuantity: '',
    lowStockThreshold: '5',
    manufacturingTime: '',
    inStock: true,
    customizable: true,
    materialId: '',
    numberOfColors: '1',
    modelFile: '',
    features: [''],
    finish: '',
    modelOrientation: { x: 0, y: 0, z: 0 }
  })
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadMaterials()
  }, [])

  useEffect(() => {
    if (formData.materialId) {
      loadMaterialColors()
    }
  }, [formData.materialId])

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
      }
    } catch (error) {
      console.error('Failed to load materials:', error)
      setMaterials([])
    }
  }

  const loadMaterialColors = async () => {
    try {
      const response = await fetch(`/api/materials/${formData.materialId}/colors`)
      if (response.ok) {
        const data = await response.json()
        setAvailableColors(data.colors)
      }
    } catch (error) {
      console.error('Failed to load material colors:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        lowStockThreshold: parseInt(formData.lowStockThreshold),
        numberOfColors: parseInt(formData.numberOfColors),
        features: formData.features.filter(f => f.trim() !== ''),
        images: formData.image ? [formData.image] : [],
        modelOrientation: formData.modelOrientation
      }

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Product created successfully:', data.product)
        router.push('/admin/dashboard')
      } else {
        alert(data.error || 'Failed to create product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
      alert('An error occurred while creating the product')
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

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.stl') && !fileName.endsWith('.3mf')) {
      alert('Please select a valid STL or 3MF file')
      return
    }

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
        if (fileName.endsWith('.3mf')) {
          console.log('Admin: Analyzing 3MF file:', fileName)
          try {
            const analysisFormData = new FormData()
            analysisFormData.append('file', file)

            console.log('Admin: Sending analysis request to /api/analyze-3mf')
            const analysisResponse = await fetch('/api/analyze-3mf', {
              method: 'POST',
              body: analysisFormData
            })

            console.log('Admin: Analysis response status:', analysisResponse.status)
            if (analysisResponse.ok) {
              const analysisData = await analysisResponse.json()
              console.log('Admin: Analysis data received:', analysisData)
              setModelAnalysis(analysisData)

              // Auto-suggest number of colors based on analysis
              if (analysisData.recommendations?.numberOfColors) {
                console.log('Admin: Auto-setting number of colors to:', analysisData.recommendations.numberOfColors)
                setFormData(prev => ({
                  ...prev,
                  numberOfColors: analysisData.recommendations.numberOfColors.toString()
                }))
              }
            } else {
              const errorData = await analysisResponse.text()
              console.error('Admin: Analysis API error:', analysisResponse.status, errorData)
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
        alert(data.error || '3D model upload failed')
      }
    } catch (error) {
      console.error('STL upload error:', error)
      alert('Failed to upload 3D model file')
    } finally {
      setModelUploading(false)
    }
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, features: newFeatures }))
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
            <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
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
                    <option value="premium">Premium</option>
                    <option value="standard">Standard</option>
                    <option value="custom">Custom</option>
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

              {/* Material & 3D Model Configuration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Box className="h-5 w-5 mr-2" />
                  Material & 3D Model Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Material Selection */}
                  <div>
                    <label htmlFor="materialId" className="block text-sm font-medium text-gray-700 mb-2">
                      Material *
                    </label>
                    <select
                      id="materialId"
                      name="materialId"
                      value={formData.materialId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="">Select Material</option>
                      {materials && materials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.displayName}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Choose the 3D printing material for this product</p>
                  </div>

                  {/* Number of Colors */}
                  <div>
                    <label htmlFor="numberOfColors" className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Colors *
                    </label>
                    <select
                      id="numberOfColors"
                      name="numberOfColors"
                      value={formData.numberOfColors}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                      <option value="1">1 Color</option>
                      <option value="2">2 Colors</option>
                      <option value="3">3 Colors</option>
                      <option value="4">4 Colors</option>
                      <option value="5">5 Colors</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">How many different colors customers can choose</p>
                  </div>
                </div>

                {/* STL Model Upload */}
                <div className="mt-6">
                  <label htmlFor="modelFile" className="block text-sm font-medium text-gray-700 mb-2">
                    3D Model (STL or 3MF File)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="modelFile"
                      name="modelFile"
                      value={formData.modelFile}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="Upload an STL or 3MF file or enter URL"
                      readOnly
                    />
                    <input
                      type="file"
                      id="modelFileUpload"
                      accept=".stl,.3mf"
                      onChange={handleModelUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('modelFileUpload')?.click()}
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
                  <p className="text-xs text-gray-500 mt-1">Upload a 3D model file for interactive preview (max 50MB)</p>
                </div>

                {/* 3MF Analysis Results */}
                {modelAnalysis && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                      <Box className="h-4 w-4 mr-2" />
                      3MF Model Analysis
                    </h4>

                    <div className="space-y-3">
                      {/* Summary */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">File:</span>
                          <span className="ml-2 text-blue-700">{modelAnalysis.analysis?.filename}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Size:</span>
                          <span className="ml-2 text-blue-700">{Math.round(modelAnalysis.analysis?.fileSize / 1024)} KB</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Meshes:</span>
                          <span className="ml-2 text-blue-700">{modelAnalysis.summary?.totalMeshes || 0}</span>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">Color Zones:</span>
                          <span className="ml-2 text-blue-700">{modelAnalysis.summary?.colorZones || 0}</span>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Recommendation:</span> {modelAnalysis.recommendations?.reason}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Suggested number of colors: {modelAnalysis.recommendations?.numberOfColors || 1}
                        </p>
                      </div>

                      {/* Materials detected */}
                      {modelAnalysis.analysis?.materials?.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-800 text-sm">Materials found in 3MF:</span>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {modelAnalysis.analysis.materials.slice(0, 4).map((material: any, index: number) => (
                              <div key={index} className="flex items-center text-xs">
                                <div
                                  className="w-3 h-3 rounded mr-2 border border-gray-300"
                                  style={{ backgroundColor: material.displayColor }}
                                />
                                <span className="text-blue-700">{material.name}</span>
                              </div>
                            ))}
                          </div>
                          {modelAnalysis.analysis.materials.length > 4 && (
                            <p className="text-xs text-blue-600 mt-1">
                              ...and {modelAnalysis.analysis.materials.length - 4} more
                            </p>
                          )}
                        </div>
                      )}

                      {/* Multi-color support indicator */}
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-blue-800">Multi-color support:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          modelAnalysis.summary?.supportsMultiColor
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {modelAnalysis.summary?.supportsMultiColor ? 'Yes' : 'Single color only'}
                        </span>
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

                {/* Available Colors Preview */}
                {formData.materialId && availableColors.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Palette className="h-4 w-4 mr-2" />
                      Available Colors for {materials && materials.find(m => m.id === formData.materialId)?.displayName}
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {availableColors.slice(0, 16).map(color => (
                        <div key={color.id} className="flex flex-col items-center">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm"
                            style={{ backgroundColor: color.hexCode }}
                            title={color.displayName}
                          />
                          <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                            {color.displayName}
                          </span>
                        </div>
                      ))}
                      {availableColors.length > 16 && (
                        <div className="flex items-center justify-center text-xs text-gray-500">
                          +{availableColors.length - 16} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Features
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder={`Feature ${index + 1}`}
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Feature
                </button>
              </div>

              {/* Finish & Customization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="finish" className="block text-sm font-medium text-gray-700 mb-2">
                    Finish
                  </label>
                  <input
                    type="text"
                    id="finish"
                    name="finish"
                    value={formData.finish}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="e.g., Matte Black, Antique Gold"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="customizable"
                    name="customizable"
                    checked={formData.customizable}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <label htmlFor="customizable" className="ml-2 text-sm font-medium text-gray-700">
                    Allow Customization (engraving, colors, etc.)
                  </label>
                </div>
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
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Add Product
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