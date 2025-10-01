'use client'

import { useState, useEffect } from 'react'
import { Check, Palette } from 'lucide-react'

interface Material {
  id: string
  name: string
  displayName: string
}

interface Color {
  id: string
  name: string
  displayName: string
  hexCode: string
  isSpecial: boolean
}

interface ColorSelectorProps {
  materialId: string
  numberOfColors: number
  onColorSelect: (colors: string[]) => void
  initialColors?: string[]
}

export function ColorSelector({
  materialId,
  numberOfColors,
  onColorSelect,
  initialColors = []
}: ColorSelectorProps) {
  const [selectedColors, setSelectedColors] = useState<string[]>(initialColors)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  const [material, setMaterial] = useState<Material | null>(null)
  const [availableColors, setAvailableColors] = useState<Color[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch material and its colors
  useEffect(() => {
    async function fetchMaterialColors() {
      try {
        setLoading(true)
        const response = await fetch(`/api/materials/${materialId}/colors`)
        if (response.ok) {
          const data = await response.json()
          setMaterial(data.material)
          setAvailableColors(data.colors)
        }
      } catch (error) {
        console.error('Failed to fetch material colors:', error)
      } finally {
        setLoading(false)
      }
    }

    if (materialId) {
      fetchMaterialColors()
    }
  }, [materialId])

  useEffect(() => {
    console.log('ColorSelector: useEffect triggered, calling onColorSelect with:', selectedColors)
    onColorSelect(selectedColors)
  }, [selectedColors, onColorSelect])

  const handleColorClick = (colorName: string) => {
    console.log('ColorSelector: handleColorClick called with color:', colorName)
    console.log('ColorSelector: Current selectedColors:', selectedColors)
    console.log('ColorSelector: numberOfColors:', numberOfColors)

    if (numberOfColors === 1) {
      // Single color selection - replace
      console.log('ColorSelector: Single color mode, setting to:', [colorName])
      setSelectedColors([colorName])
    } else {
      // Multiple color selection
      const isSelected = selectedColors.includes(colorName)
      console.log('ColorSelector: Multiple color mode, isSelected:', isSelected)

      if (isSelected) {
        // Remove color
        const newColors = selectedColors.filter(c => c !== colorName)
        console.log('ColorSelector: Removing color, new selection:', newColors)
        setSelectedColors(newColors)
      } else if (selectedColors.length < numberOfColors) {
        // Add color if under limit
        const newColors = [...selectedColors, colorName]
        console.log('ColorSelector: Adding color, new selection:', newColors)
        setSelectedColors(newColors)
      } else {
        // Replace oldest selection if at limit
        const newColors = [...selectedColors.slice(1), colorName]
        console.log('ColorSelector: Replacing oldest, new selection:', newColors)
        setSelectedColors(newColors)
      }
    }
  }

  const getColorLabel = () => {
    if (numberOfColors === 1) {
      return 'Select Color'
    } else if (selectedColors.length === 0) {
      return `Select up to ${numberOfColors} colors`
    } else if (selectedColors.length < numberOfColors) {
      return `Select ${numberOfColors - selectedColors.length} more color${numberOfColors - selectedColors.length > 1 ? 's' : ''}`
    } else {
      return selectedColors.join(', ')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Palette className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium text-gray-900">Loading colors...</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-900 flex items-center">
          <Palette className="h-4 w-4 mr-2" />
          {getColorLabel()}
        </label>
        {selectedColors.length > 0 && numberOfColors > 1 && (
          <button
            onClick={() => setSelectedColors([])}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {availableColors.map(color => {
          const isSelected = selectedColors.includes(color.name)
          const selectionIndex = selectedColors.indexOf(color.name)

          return (
            <button
              key={color.id}
              onClick={() => handleColorClick(color.name)}
              onMouseEnter={() => setHoveredColor(color.name)}
              onMouseLeave={() => setHoveredColor(null)}
              className={`
                relative group p-2 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
              title={color.displayName}
            >
              {/* Color swatch */}
              <div className="relative">
                <div
                  className="w-full aspect-square rounded-md border shadow-sm border-gray-200"
                  style={{
                    backgroundColor: color.hexCode,
                    backgroundImage: color.isSpecial
                      ? color.name.includes('glow')
                        ? 'linear-gradient(45deg, #90EE90, #ADFF2F)'
                        : color.name.includes('wood')
                        ? 'linear-gradient(135deg, #8B4513, #A0522D)'
                        : color.name.includes('carbon')
                        ? 'linear-gradient(45deg, #2F4F4F, #000000)'
                        : undefined
                      : undefined
                  }}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-yellow-500 text-white rounded-full p-1">
                        {numberOfColors > 1 ? (
                          <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">
                            {selectionIndex + 1}
                          </span>
                        ) : (
                          <Check className="h-4 w-4" strokeWidth={3} />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Color name */}
              <p className={`
                text-xs mt-1 truncate
                ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-600'}
              `}>
                {color.displayName}
              </p>

              {/* Hover tooltip for special colors */}
              {hoveredColor === color.name && color.isSpecial && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                  Special filament
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected colors summary */}
      {selectedColors.length > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <span className="font-medium">Selected: </span>
          {selectedColors.join(', ')}
        </div>
      )}

      {/* Material info */}
      <div className="text-xs text-gray-500">
        Material: {typeof material === 'object' && material !== null ? (material?.displayName || material?.name || 'Unknown Object') : String(material || 'Unknown')} • {availableColors.length} colors available
      </div>
    </div>
  )
}