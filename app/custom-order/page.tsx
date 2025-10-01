'use client'

import { useState } from 'react'
import { Upload, Send } from 'lucide-react'

export default function CustomOrderPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    budget: '',
    timeline: '',
    referenceImages: [] as File[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referenceImages: []
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          name: '',
          email: '',
          phone: '',
          description: '',
          budget: '',
          timeline: '',
          referenceImages: []
        })
      }
    } catch (error) {
      console.error('Error submitting custom order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-green-600 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-4">Request Received!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for your custom order request. Our craftsman will review your design and contact you within 24-48 hours with a quote and timeline.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="bg-gray-900 text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold font-medieval mb-6 text-center">
            Forge Your <span className="text-nub-gold">Custom Masterpiece</span>
          </h1>
          <p className="text-gray-600 text-center mb-12">
            Have a unique design in mind? Our expert craftsman can create a one-of-a-kind sword hilt nub holder tailored to your specifications.
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Design Description *</label>
                <textarea
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                  placeholder="Describe your custom design in detail. Include preferred materials, finishes, engravings, themes (e.g., medieval, fantasy, military), and any specific requirements..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Budget Range *</label>
                  <select
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                  >
                    <option value="">Select budget</option>
                    <option value="100-150">$100 - $150</option>
                    <option value="150-200">$150 - $200</option>
                    <option value="200-300">$200 - $300</option>
                    <option value="300+">$300+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timeline *</label>
                  <select
                    required
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                  >
                    <option value="">Select timeline</option>
                    <option value="2-3 weeks">2-3 weeks</option>
                    <option value="3-4 weeks">3-4 weeks</option>
                    <option value="4-6 weeks">4-6 weeks</option>
                    <option value="6+ weeks">6+ weeks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reference Images (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    Upload reference images for your design
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setFormData({ ...formData, referenceImages: files })
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-3 inline-block bg-gray-900 text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-800 transition-colors"
                  >
                    Choose Files
                  </label>
                  {formData.referenceImages.length > 0 && (
                    <p className="mt-3 text-sm text-gray-600">
                      {formData.referenceImages.length} file(s) selected
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What Happens Next?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Our craftsman will review your design within 24-48 hours</li>
                  <li>• You&apos;ll receive a detailed quote and timeline</li>
                  <li>• Once approved, we&apos;ll create a 3D mockup for your review</li>
                  <li>• After final approval, production begins</li>
                  <li>• Your custom piece will be shipped with tracking</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    Submit Custom Order Request
                    <Send className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}