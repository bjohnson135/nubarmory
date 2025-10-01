'use client'

import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, selectedCategory, priceRange, sortBy])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = [...products]

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }

    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number)
      filtered = filtered.filter(p => {
        if (max) {
          return p.price >= min && p.price <= max
        }
        return p.price >= min
      })
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredProducts(filtered)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-medieval mb-4">
            Our <span className="text-nub-gold">Arsenal</span>
          </h1>
          <p className="text-gray-600">
            Discover our collection of premium sword hilt cigar nub holders
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
                Filters
                <Filter className="h-5 w-5" />
              </h2>

              <div className="mb-6">
                <h3 className="font-medium mb-3">Category</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    All Products
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="standard"
                      checked={selectedCategory === 'standard'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    Standard
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="premium"
                      checked={selectedCategory === 'premium'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    Premium
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value="custom"
                      checked={selectedCategory === 'custom'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    Custom
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value="all"
                      checked={priceRange === 'all'}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="mr-2"
                    />
                    All Prices
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value="0-50"
                      checked={priceRange === '0-50'}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="mr-2"
                    />
                    Under $50
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value="50-75"
                      checked={priceRange === '50-75'}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="mr-2"
                    />
                    $50 - $75
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value="75-100"
                      checked={priceRange === '75-100'}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="mr-2"
                    />
                    $75 - $100
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="price"
                      value="100-999"
                      checked={priceRange === '100-999'}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="mr-2"
                    />
                    Over $100
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="name">Name</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-4 bg-gray-900 text-white px-4 py-2 rounded flex items-center"
            >
              <Filter className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts
                .filter((product) => product.id) // Filter out products without IDs
                .map((product, index) => (
                  <ProductCard key={product.id || `product-${index}`} product={product} />
                ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}