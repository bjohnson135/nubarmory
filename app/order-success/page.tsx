'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Shield, CheckCircle, Package, Mail, ArrowRight } from 'lucide-react'

interface OrderDetails {
  id: string
  customerName: string
  customerEmail: string
  total: number
  status: string
  items: Array<{
    productName: string
    quantity: number
    price: number
    customization?: string
  }>
  shippingAddress: any
  createdAt: string
}

export default function OrderSuccess() {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  const orderId = searchParams.get('order_id')
  const paymentIntentId = searchParams.get('payment_intent') || searchParams.get('payment_intent_id')
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails()
      // Trigger confirmation email sending
      sendConfirmationEmail()
    } else {
      setError('No order ID provided')
      setLoading(false)
    }
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        setError('Order not found')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const sendConfirmationEmail = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/send-confirmation`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        console.log('Confirmation email sent successfully')
      } else {
        console.log('Email not sent:', data.message)
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-md"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Shield className="h-8 w-8 text-yellow-600 mr-3" />
            <span className="text-xl font-bold text-gray-900">NubArmory</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-lg text-gray-600">
            Thank you for your order. We've received your payment and will begin processing your items.
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-600">Order #{order.id}</p>
            <p className="text-sm text-gray-600">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {item.customization && (
                      <p className="text-sm text-gray-600">
                        Customization: {
                          typeof item.customization === 'string'
                            ? item.customization
                            : typeof item.customization === 'object'
                              ? Object.entries(item.customization)
                                  .filter(([key, value]) => value)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(', ')
                              : JSON.stringify(item.customization)
                        }
                      </p>
                    )}
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
            <div className="text-gray-600">
              <p>{order.customerName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Paid:</span>
              <span className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <Package className="h-6 w-6 text-yellow-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">What happens next?</h3>
              <ul className="text-yellow-700 space-y-1">
                <li>• You'll receive an order confirmation email shortly</li>
                <li>• We'll begin crafting your custom sword hilt(s)</li>
                <li>• You'll get tracking information once your order ships</li>
                <li>• Typical production time is 2-3 business days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <Mail className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h3 className="font-semibold text-blue-800">Confirmation Email</h3>
              <p className="text-blue-700">
                A detailed order confirmation has been sent to <strong>{order.customerEmail}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-md font-medium flex items-center justify-center"
          >
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-md font-medium"
          >
            Print Order Details
          </button>
        </div>
      </div>
    </div>
  )
}