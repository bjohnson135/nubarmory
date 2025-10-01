import Link from 'next/link'
import { ChevronRight, Shield, Award, Wrench, Star, ShoppingBag, Palette } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { getFeaturedProducts } from '@/lib/products'

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-semibold">
                🛡️ VETERAN OWNED & OPERATED
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              Premium Cigar Nub Holders
              <span className="block text-yellow-500 font-medieval mt-2">Forged with Honor</span>
            </h1>

            <p className="text-xl md:text-2xl mb-10 text-gray-200 max-w-3xl mx-auto">
              3D printed sword hilt designs. Made-to-order masterpieces for the distinguished cigar connoisseur.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl inline-flex items-center justify-center"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Shop Collection
              </Link>
              <Link
                href="/custom-order"
                className="border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-gray-900 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 inline-flex items-center justify-center"
              >
                <Palette className="mr-2 h-5 w-5" />
                Custom Design
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Why Choose <span className="text-yellow-500">NubArmory</span>
            </h2>
            <p className="text-xl text-gray-600">
              Quality craftsmanship meets military precision
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Veteran Crafted</h3>
              <p className="text-gray-600">
                Proudly veteran-owned and operated, bringing military precision to every piece
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Premium Quality</h3>
              <p className="text-gray-600">
                High-grade PLA+ materials and expert 3D printing for lasting durability
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wrench className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Made to Order</h3>
              <p className="text-gray-600">
                Custom designs available to match your unique style and preferences
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Featured <span className="text-yellow-500">Collection</span>
            </h2>
            <p className="text-xl text-gray-600">
              Our most popular sword hilt designs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/products"
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center transition-colors"
            >
              View All Products
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Customer <span className="text-yellow-500">Reviews</span>
            </h2>
            <p className="text-xl text-gray-600">
              Hear from our satisfied customers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "John D.",
                title: "Cigar Enthusiast",
                rating: 5,
                text: "Absolutely love my Excalibur nub holder! The quality is outstanding and it's a real conversation starter at the lounge."
              },
              {
                name: "Mike R.",
                title: "Fellow Veteran",
                rating: 5,
                text: "As a fellow vet, I appreciate the attention to detail. Custom order came out perfect. Will definitely order more!"
              },
              {
                name: "Carlos M.",
                title: "Collector",
                rating: 5,
                text: "The Viking design is incredible! Solid construction and the 3D printing quality exceeded my expectations."
              }
            ].map((review, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">"{review.text}"</p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold mr-3">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{review.name}</p>
                    <p className="text-sm text-gray-500">{review.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-500 to-yellow-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              Ready to Forge Your Legend?
            </h2>
            <p className="text-xl mb-8 text-gray-800">
              Create a custom sword hilt nub holder that's uniquely yours
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/custom-order"
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors inline-flex items-center justify-center"
              >
                Start Custom Order
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/products"
                className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 py-4 rounded-lg font-bold text-lg transition-colors inline-flex items-center justify-center"
              >
                Browse Collection
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}