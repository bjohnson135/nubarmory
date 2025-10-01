'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Palette, Plus, Edit2, Trash2, Save, X, Check } from 'lucide-react'

interface Color {
  id: string
  name: string
  displayName: string
  hexCode: string
  description: string | null
  isSpecial: boolean
  isActive: boolean
  sortOrder: number
}

interface Material {
  id: string
  name: string
  displayName: string
  description: string | null
  isActive: boolean
  colors: {
    id: string
    colorId: string
    isDefault: boolean
    isAvailable: boolean
    priceModifier: number
    color: Color
  }[]
}

export default function ColorsManagementPage() {
  const [colors, setColors] = useState<Color[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [editingColor, setEditingColor] = useState<string | null>(null)
  const [newColor, setNewColor] = useState({
    name: '',
    displayName: '',
    hexCode: '#000000',
    description: '',
    isSpecial: false
  })
  const [showNewColorForm, setShowNewColorForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchData()
  }, [])

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

  const fetchData = async () => {
    try {
      const [colorsRes, materialsRes] = await Promise.all([
        fetch('/api/admin/colors'),
        fetch('/api/admin/materials')
      ])

      if (colorsRes.ok && materialsRes.ok) {
        const colorsData = await colorsRes.json()
        const materialsData = await materialsRes.json()
        setColors(colorsData.colors || [])
        setMaterials(materialsData.materials || [])
        if (materialsData.materials?.length > 0) {
          setSelectedMaterial(materialsData.materials[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateColor = async () => {
    try {
      const response = await fetch('/api/admin/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColor)
      })

      if (response.ok) {
        await fetchData()
        setShowNewColorForm(false)
        setNewColor({
          name: '',
          displayName: '',
          hexCode: '#000000',
          description: '',
          isSpecial: false
        })
      }
    } catch (error) {
      console.error('Error creating color:', error)
    }
  }

  const handleUpdateColor = async (colorId: string, updates: Partial<Color>) => {
    try {
      const response = await fetch(`/api/admin/colors/${colorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchData()
        setEditingColor(null)
      }
    } catch (error) {
      console.error('Error updating color:', error)
    }
  }

  const handleDeleteColor = async (colorId: string) => {
    if (!confirm('Are you sure you want to delete this color?')) return

    try {
      const response = await fetch(`/api/admin/colors/${colorId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error deleting color:', error)
    }
  }

  const handleToggleMaterialColor = async (materialId: string, colorId: string, isCurrentlyAvailable: boolean) => {
    try {
      const response = await fetch('/api/admin/material-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId,
          colorId,
          isAvailable: !isCurrentlyAvailable
        })
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating material color:', error)
    }
  }

  const handleToggleDefault = async (materialId: string, colorId: string, isCurrentlyDefault: boolean) => {
    try {
      const response = await fetch('/api/admin/material-colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId,
          colorId,
          isDefault: !isCurrentlyDefault
        })
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating material color default:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    )
  }

  const currentMaterial = materials.find(m => m.id === selectedMaterial)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-yellow-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Color Management</h1>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Colors List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Platform Colors
                </h2>
                <button
                  onClick={() => setShowNewColorForm(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Color
                </button>
              </div>
            </div>

            <div className="p-6">
              {showNewColorForm && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-3">New Color</h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Internal Name"
                      value={newColor.name}
                      onChange={(e) => setNewColor({ ...newColor, name: e.target.value.replace(/\s+/g, '_') })}
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Display Name"
                      value={newColor.displayName}
                      onChange={(e) => setNewColor({ ...newColor, displayName: e.target.value })}
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                    <input
                      type="color"
                      value={newColor.hexCode}
                      onChange={(e) => setNewColor({ ...newColor, hexCode: e.target.value })}
                      className="h-10 w-full border rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={newColor.description}
                      onChange={(e) => setNewColor({ ...newColor, description: e.target.value })}
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newColor.isSpecial}
                        onChange={(e) => setNewColor({ ...newColor, isSpecial: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">Special Color</span>
                    </label>
                    <div className="space-x-2">
                      <button
                        onClick={() => setShowNewColorForm(false)}
                        className="px-3 py-1 border rounded-md text-sm hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateColor}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {colors.map(color => (
                  <div
                    key={color.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-300"
                        style={{ backgroundColor: color.hexCode }}
                      />
                      <div>
                        <p className="font-medium text-sm">{color.displayName}</p>
                        {color.description && (
                          <p className="text-xs text-gray-500">{color.description}</p>
                        )}
                        {color.isSpecial && (
                          <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded mt-1">
                            Special
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingColor(color.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteColor(color.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Material-Color Associations */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold mb-3">Material Color Assignments</h2>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-6">
              {currentMaterial && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Select which colors are available for {currentMaterial.displayName}
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {colors.map(color => {
                      const materialColor = currentMaterial.colors.find(mc => mc.color.id === color.id)
                      const isAvailable = materialColor?.isAvailable || false
                      const isDefault = materialColor?.isDefault || false

                      return (
                        <div
                          key={color.id}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            isAvailable ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isAvailable}
                              onChange={() => handleToggleMaterialColor(currentMaterial.id, color.id, isAvailable)}
                              className="h-4 w-4 text-green-600"
                            />
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: color.hexCode }}
                            />
                            <span className="text-sm font-medium">{color.displayName}</span>
                          </div>
                          {isAvailable && (
                            <label className="flex items-center text-sm">
                              <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={() => handleToggleDefault(currentMaterial.id, color.id, isDefault)}
                                className="mr-2 h-3 w-3"
                              />
                              Default
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}