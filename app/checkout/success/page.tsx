import Link from 'next/link'
import { CheckCircle, Package } from 'lucide-react'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 mb-8">
              Thank you for your order. We've received your payment and will begin crafting your sword hilt nub holder immediately.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                What Happens Next?
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>• You'll receive an email confirmation shortly</li>
                <li>• Our craftsman will begin 3D printing your order</li>
                <li>• Quality inspection and finishing touches</li>
                <li>• Your order will ship within 3-5 business days</li>
                <li>• Tracking information will be sent to your email</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="bg-gray-900 text-white px-6 py-3 rounded font-semibold hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="border-2 border-gray-900 text-gray-900 px-6 py-3 rounded font-semibold hover:bg-gray-100 transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}