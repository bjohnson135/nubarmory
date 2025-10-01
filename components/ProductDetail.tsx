'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ShoppingCart, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/types'
import { useCart } from './CartContext'
import { ColorSelector } from './ColorSelector'
import ModelViewer from './ModelViewer'

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  // Stabilize materialId to prevent unnecessary re-renders
  const productMaterialId = (product as any).materialId
  const materialId = useMemo(() => productMaterialId, [productMaterialId])

  // Initialize with default colors from product if available
  const productAvailableColors = (product as any).availableColors
  const productNumberOfColors = (product as any).numberOfColors
  const defaultColors = useMemo(() =>
    productAvailableColors?.slice(0, productNumberOfColors || 1) || [],
    [productAvailableColors, productNumberOfColors]
  )

  const [selectedColors, setSelectedColors] = useState<string[]>(defaultColors)
  const [selectedColorHexes, setSelectedColorHexes] = useState<string[]>([])
  const [customization, setCustomization] = useState({
    engraving: '',
    finish: product.finish,
    colors: defaultColors
  })
  const { addItem } = useCart()

  // Handle color selection from ColorSelector
  const handleColorSelect = useCallback((colors: string[]) => {
    console.log('ProductDetail: ColorSelector onColorSelect called with:', colors)
    setSelectedColors(colors)
    setCustomization(prev => ({ ...prev, colors }))
  }, [])

  // Convert color names to hex codes for 3D viewer
  const convertColorNamesToHex = useCallback(async (colorNames: string[]) => {
    console.log('ProductDetail: Converting color names to hex:', colorNames)
    if (!colorNames.length || !materialId) {
      console.log('ProductDetail: No colors or materialId, using default')
      setSelectedColorHexes(['#888888'])
      return []
    }

    try {
      const response = await fetch(`/api/materials/${materialId}/colors`)
      if (response.ok) {
        const data = await response.json()
        const hexCodes = colorNames.map(colorName => {
          const color = data.colors.find((c: any) => c.name === colorName)
          const hexCode = color ? color.hexCode : '#888888'
          console.log(`ProductDetail: Color "${colorName}" -> ${hexCode}`)
          return hexCode
        })
        console.log('ProductDetail: Final hex codes:', hexCodes)
        setSelectedColorHexes(hexCodes)
      }
    } catch (error) {
      console.error('Failed to convert color names to hex:', error)
      setSelectedColorHexes(['#888888'])
    }
  }, [materialId])

  // Convert selected colors to hex codes for 3D viewer
  useEffect(() => {
    const convertColorsToHex = async () => {
      const colorsToConvert = selectedColors.length > 0 ? selectedColors : defaultColors

      if (!colorsToConvert.length || !materialId) {
        setSelectedColorHexes(['#888888'])
        return
      }

      try {
        const response = await fetch(`/api/materials/${materialId}/colors`)
        if (response.ok) {
          const data = await response.json()
          const hexCodes = colorsToConvert.map(colorName => {
            const color = data.colors.find((c: any) => c.name === colorName)
            return color ? color.hexCode : '#888888'
          })
          setSelectedColorHexes(hexCodes)
        }
      } catch (error) {
        console.error('Failed to convert colors to hex:', error)
        setSelectedColorHexes(['#888888'])
      }
    }

    convertColorsToHex()
  }, [selectedColors, defaultColors, materialId])

  const handleAddToCart = () => {
    const finalCustomization = {
      ...customization,
      colors: selectedColors
    }
    addItem(product, quantity, product.customizable || selectedColors.length > 0 ? finalCustomization : undefined)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <Link
          href="/products"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-8 p-8">
            <div>
              {(product as any).modelFile ? (
                // 3D Model Viewer
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                    <ModelViewer
                      modelUrl={(product as any).modelFile}
                      selectedColors={selectedColorHexes.length > 0 ? selectedColorHexes : (selectedColors.length > 0 ? selectedColors : ['#888888'])}
                      width={500}
                      height={400}
                      initialRotation={(product as any).modelOrientation || { x: 0, y: 0, z: 0 }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Interactive 3D Preview</p>
                    <p className="text-xs text-gray-500">Drag to rotate • Scroll to zoom</p>
                  </div>
                  {/* Traditional images as thumbnails if available */}
                  {product.images.length > 0 && (
                    <div className="flex gap-2 justify-center">
                      {product.images.map((image, index) => (
                        <div key={index} className="w-16 h-16 bg-gray-200 rounded overflow-hidden">
                          <Image
                            src={image}
                            alt={`${product.name} ${index + 1}`}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Traditional Image Gallery
                <div>
                  <div className="relative h-96 bg-gray-200 rounded-lg mb-4">
                    {product.images[selectedImage] && (
                      <Image
                        src={product.images[selectedImage]}
                        alt={product.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    )}
                  </div>
                  {product.images.length > 1 && (
                    <div className="flex gap-2 justify-center">
                      {product.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`w-20 h-20 bg-gray-200 rounded ${
                            selectedImage === index ? 'ring-2 ring-nub-gold' : ''
                          }`}
                        >
                          {product.images[index] && (
                            <Image
                              src={product.images[index]}
                              alt={`${product.name} ${index + 1}`}
                              width={80}
                              height={80}
                              className="object-cover rounded"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="mb-6">
                <span className="text-sm text-gray-600 uppercase tracking-wide">
                  {product.category}
                </span>
                <h1 className="text-3xl font-bold font-medieval mt-2 mb-4">
                  {product.name}
                </h1>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="text-3xl font-bold text-nub-gold mb-4">
                  ${product.price.toFixed(2)}
                </div>

                {/* Inventory Status */}
                <div className="mb-6 p-3 rounded-lg border border-gray-200 bg-gray-50">
                  {product.stockQuantity && product.stockQuantity > 0 ? (
                    <div className="flex items-center text-green-600">
                      <Check className="h-5 w-5 mr-2" />
                      <span className="font-medium">
                        {product.stockQuantity <= 5
                          ? `Only ${product.stockQuantity} left in stock`
                          : 'In Stock'
                        } - Ships within 1-2 business days
                      </span>
                    </div>
                  ) : (
                    <div className="text-orange-600">
                      <div className="flex items-center mb-1">
                        <span className="font-medium">⚠️ Made to Order</span>
                      </div>
                      <p className="text-sm">
                        {(product as any).manufacturingTime
                          ? `Estimated delivery: ${(product as any).manufacturingTime}`
                          : 'Contact us for delivery timeframe'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Color Selection */}
              {materialId && (
                <div className="mb-6">
                  <ColorSelector
                    materialId={materialId}
                    numberOfColors={(product as any).numberOfColors || 1}
                    onColorSelect={handleColorSelect}
                  />
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">Specifications</h3>
                <div className="space-y-2 text-gray-600">
                  <p><span className="font-medium">Material:</span> {typeof (product as any).material === 'object' && (product as any).material !== null
                    ? ((product as any).material?.displayName || (product as any).material?.name || 'Unknown Object')
                    : String((product as any).material || product.material || 'Unknown')}</p>
                  <p><span className="font-medium">Finish:</span> {product.finish}</p>
                  <p><span className="font-medium">Customizable:</span> {product.customizable ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {product.customizable && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Customization Options</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Custom Engraving (Optional)
                      </label>
                      <input
                        type="text"
                        value={customization.engraving}
                        onChange={(e) =>
                          setCustomization({ ...customization, engraving: e.target.value })
                        }
                        placeholder="Enter your custom text"
                        className="w-full p-2 border rounded"
                        maxLength={50}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Max 50 characters
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded border hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="font-semibold text-lg">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded border hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className={`w-full py-3 px-6 rounded font-semibold flex items-center justify-center ${
                  product.inStock
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}