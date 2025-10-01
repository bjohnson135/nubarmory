'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useCart } from '@/components/CartContext'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Safely get the Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null

function CheckoutForm({
  orderId,
  customerInfo,
  shippingAddress,
  onCustomerInfoChange,
  onShippingAddressChange
}: {
  orderId: string
  customerInfo: { name: string; email: string; phone: string }
  shippingAddress: { line1: string; line2: string; city: string; state: string; zipCode: string; country: string }
  onCustomerInfoChange: (info: { name: string; email: string; phone: string }) => void
  onShippingAddressChange: (address: { line1: string; line2: string; city: string; state: string; zipCode: string; country: string }) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const { items, totalPrice, clearCart } = useCart()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    try {
      // First, update the order with the shipping address and customer info
      const updateResponse = await fetch(`/api/orders/${orderId}/update-shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo,
          shippingAddress
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update order with shipping information')
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order-success?order_id=${orderId}`,
          payment_method_data: {
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone,
              address: {
                line1: shippingAddress.line1,
                line2: shippingAddress.line2 || undefined,
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.zipCode,
                country: shippingAddress.country
              }
            }
          }
        }
      })

      if (result.error) {
        // Check if this is a serious error that should redirect to failure page
        const errorMessage = result.error.message || 'Payment failed'
        if (result.error.type === 'card_error' || result.error.type === 'validation_error') {
          // Show inline error for card issues that user can fix
          setError(errorMessage)
        } else {
          // Redirect to failure page for other errors
          router.push(`/payment-failed?error=${encodeURIComponent(errorMessage)}`)
        }
      } else {
        // For payment methods that require redirect (like Klarna), Stripe will handle the redirect automatically
        // For immediate payments (like cards), we should get a paymentIntent back
        if ('paymentIntent' in result && result.paymentIntent && (result.paymentIntent as any).status === 'succeeded') {
          // Payment successful - clear cart and redirect to success page
          clearCart()
          router.push(`/order-success?order_id=${orderId}&payment_intent=${(result.paymentIntent as any).id}`)
        } else {
          // Payment is processing or requires redirect - Stripe will handle this
          clearCart() // Clear cart as payment is in progress
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              required
              value={customerInfo.name}
              onChange={(e) => onCustomerInfoChange({ ...customerInfo, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nub-gold focus:border-transparent"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              required
              value={customerInfo.email}
              onChange={(e) => onCustomerInfoChange({ ...customerInfo, email: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nub-gold focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={customerInfo.phone}
              onChange={(e) => onCustomerInfoChange({ ...customerInfo, phone: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nub-gold focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
        <div className="border border-gray-300 rounded-md p-4">
          <PaymentElement />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isProcessing || !stripe || !elements || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
        className="w-full bg-nub-gold hover:bg-nub-gold/90 disabled:bg-gray-400 text-gray-900 font-semibold py-3 px-4 rounded-md transition-colors flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </>
        ) : (
          `Complete Payment • $${(totalPrice * 1.08 + 9.99).toFixed(2)}`
        )}
      </button>

      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Please wait while we process your payment. Do not refresh or close this page.</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const { items, totalPrice } = useCart()
  const [clientSecret, setClientSecret] = useState('')
  const [orderId, setOrderId] = useState('')


  // For testing purposes, allow using test items if cart is empty
  const isTestMode = process.env.NODE_ENV === 'development' && items.length === 0
  const testItems = isTestMode ? [{
    product: {
      id: 'test-product',
      name: 'Test Product',
      price: 89.99,
      description: 'Test product for payment form testing',
      images: [],
      category: 'test',
      materialId: 'test-material',
      finish: 'Standard',
      inStock: true,
      stockQuantity: 10,
      lowStockThreshold: 5,
      customizable: false,
      numberOfColors: 1,
      availableColors: [],
      features: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    quantity: 1,
    customization: undefined
  }] : []

  const effectiveItems = items.length > 0 ? items : testItems
  const effectiveTotalPrice = items.length > 0 ? totalPrice : testItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'venmo' | 'apple'>('card')
  const [shippingCost, setShippingCost] = useState(0) // No cost until address entered
  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState('')
  const [shippingCalculating, setShippingCalculating] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(1) // 1: Address, 2: Shipping, 3: Payment
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [shippingAddress, setShippingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  })

  useEffect(() => {
    if (effectiveItems.length > 0) {
      fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: effectiveItems,
          customerInfo: {
            name: '',
            email: '',
            phone: ''
          },
          shippingAddress: {}
        })
      })
        .then(res => res.json())
        .then(data => {
          setClientSecret(data.clientSecret)
          setOrderId(data.orderId)
        })
        .catch(error => {
          console.error('Error creating payment intent:', error)
        })
    }
  }, [effectiveItems])

  // Function to calculate shipping manually when address is complete
  const calculateShipping = async () => {
    if (!shippingAddress.zipCode || !shippingAddress.city || !shippingAddress.state || !items.length) {
      return
    }

    setShippingCalculating(true)
    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            weightOz: (item.product as any).weightOz || 4,
            lengthIn: (item.product as any).lengthIn || 8,
            widthIn: (item.product as any).widthIn || 3,
            heightIn: (item.product as any).heightIn || 3
          })),
          shippingAddress
        })
      })

      if (response.ok) {
        const data = await response.json()
        setShippingOptions(data.carriers)
        if (data.carriers.length > 0) {
          // Default to cheapest option
          const cheapestOption = data.carriers.reduce((prev: any, curr: any) =>
            prev.cost < curr.cost ? prev : curr
          )
          setSelectedShipping(cheapestOption.service)
          setShippingCost(cheapestOption.cost)
          setCheckoutStep(2) // Move to shipping selection step
        }
      }
    } catch (error) {
      console.error('Shipping calculation failed:', error)
      alert('Unable to calculate shipping. Please try again.')
    } finally {
      setShippingCalculating(false)
    }
  }

  // Handle shipping option selection
  const handleShippingSelect = (option: any) => {
    setSelectedShipping(option.service)
    setShippingCost(option.cost)
  }

  if (effectiveItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-8">Your Cart is Empty</h1>
          <Link
            href="/products"
            className="text-blue-600 hover:underline inline-flex items-center"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const TAX_RATE = 0.08
  const tax = effectiveTotalPrice * TAX_RATE
  const total = effectiveTotalPrice + tax + shippingCost

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center ${checkoutStep >= 1 ? 'text-nub-gold' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${checkoutStep >= 1 ? 'border-nub-gold bg-nub-gold text-white' : 'border-gray-300'}`}>1</div>
                  <span className="ml-2 font-medium">Shipping Address</span>
                </div>
                <div className={`w-8 h-0.5 ${checkoutStep >= 2 ? 'bg-nub-gold' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center ${checkoutStep >= 2 ? 'text-nub-gold' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${checkoutStep >= 2 ? 'border-nub-gold bg-nub-gold text-white' : 'border-gray-300'}`}>2</div>
                  <span className="ml-2 font-medium">Shipping Options</span>
                </div>
                <div className={`w-8 h-0.5 ${checkoutStep >= 3 ? 'bg-nub-gold' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center ${checkoutStep >= 3 ? 'text-nub-gold' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${checkoutStep >= 3 ? 'border-nub-gold bg-nub-gold text-white' : 'border-gray-300'}`}>3</div>
                  <span className="ml-2 font-medium">Payment</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">

                {/* Step 1: Shipping Address */}
                {checkoutStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Shipping Address</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
                        <input
                          type="text"
                          value={shippingAddress.line1}
                          onChange={(e) => setShippingAddress({...shippingAddress, line1: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Apartment, Suite, etc. (Optional)</label>
                        <input
                          type="text"
                          value={shippingAddress.line2}
                          onChange={(e) => setShippingAddress({...shippingAddress, line2: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                          placeholder="Apt 4B"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                          <input
                            type="text"
                            value={shippingAddress.city}
                            onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                            placeholder="New York"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                          <input
                            type="text"
                            value={shippingAddress.state}
                            onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                            placeholder="NY"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                          <input
                            type="text"
                            value={shippingAddress.zipCode}
                            onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nub-gold focus:border-transparent"
                            placeholder="10001"
                          />
                        </div>
                      </div>
                      <button
                        onClick={calculateShipping}
                        disabled={!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || shippingCalculating}
                        className="w-full bg-nub-gold hover:bg-nub-gold/90 disabled:bg-gray-400 text-gray-900 font-semibold py-3 px-4 rounded-md transition-colors"
                      >
                        {shippingCalculating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 inline-block mr-2"></div>
                            Calculating Shipping...
                          </>
                        ) : (
                          'Calculate Shipping Options'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Shipping Options */}
                {checkoutStep === 2 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Shipping Options</h2>
                      <button
                        onClick={() => setCheckoutStep(1)}
                        className="text-nub-gold hover:text-nub-gold/80 font-medium"
                      >
                        ← Change Address
                      </button>
                    </div>
                    <div className="space-y-3">
                      {shippingOptions.map((option, index) => (
                        <div
                          key={index}
                          onClick={() => handleShippingSelect(option)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            selectedShipping === option.service
                              ? 'border-nub-gold bg-nub-gold/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">{option.service}</div>
                              <div className="text-sm text-gray-600">
                                {option.service === 'Local Pickup' ? (
                                  <>
                                    <div>Ready in 1-2 business days</div>
                                    <div className="text-xs">Pickup: 1120 Samantha Drive, Paso Robles, CA</div>
                                  </>
                                ) : (
                                  `Estimated delivery: ${option.estimatedDays} days`
                                )}
                              </div>
                            </div>
                            <div className="text-lg font-bold">
                              {option.cost === 0 ? 'FREE' : `$${option.cost.toFixed(2)}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setCheckoutStep(3)}
                      disabled={!selectedShipping}
                      className="w-full mt-6 bg-nub-gold hover:bg-nub-gold/90 disabled:bg-gray-400 text-gray-900 font-semibold py-3 px-4 rounded-md transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </div>
                )}

                {/* Step 3: Payment */}
                {checkoutStep === 3 && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Payment</h2>
                      <button
                        onClick={() => setCheckoutStep(2)}
                        className="text-nub-gold hover:text-nub-gold/80 font-medium"
                      >
                        ← Change Shipping
                      </button>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`p-3 border rounded ${
                            paymentMethod === 'card' ? 'border-nub-gold bg-nub-gold/10' : 'border-gray-300'
                          }`}
                        >
                          Card
                        </button>
                        <button
                          onClick={() => setPaymentMethod('paypal')}
                          className={`p-3 border rounded ${
                            paymentMethod === 'paypal' ? 'border-nub-gold bg-nub-gold/10' : 'border-gray-300'
                          }`}
                        >
                          PayPal
                        </button>
                        <button
                          onClick={() => setPaymentMethod('venmo')}
                          className={`p-3 border rounded ${
                            paymentMethod === 'venmo' ? 'border-nub-gold bg-nub-gold/10' : 'border-gray-300'
                          }`}
                        >
                          Venmo
                        </button>
                        <button
                          onClick={() => setPaymentMethod('apple')}
                          className={`p-3 border rounded ${
                            paymentMethod === 'apple' ? 'border-nub-gold bg-nub-gold/10' : 'border-gray-300'
                          }`}
                        >
                          Apple Pay
                        </button>
                      </div>
                    </div>

                    {paymentMethod === 'card' && (
                      <div>
                        {!stripePromise ? (
                          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
                            <h3 className="font-medium text-red-800">Payment Configuration Error</h3>
                            <p className="text-sm text-red-700 mt-1">Stripe is not properly configured. Please contact support.</p>
                          </div>
                        ) : clientSecret ? (
                          <Elements
                            stripe={stripePromise}
                            options={{
                              clientSecret,
                              appearance: {
                                theme: 'stripe',
                                variables: {
                                  colorPrimary: '#D4AF37'
                                }
                              }
                            }}
                          >
                            <CheckoutForm
                              orderId={orderId}
                              customerInfo={customerInfo}
                              shippingAddress={shippingAddress}
                              onCustomerInfoChange={setCustomerInfo}
                              onShippingAddressChange={setShippingAddress}
                            />
                          </Elements>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nub-gold"></div>
                            <span className="ml-3 text-gray-600">Loading payment form...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {(paymentMethod === 'paypal' || paymentMethod === 'venmo' || paymentMethod === 'apple') && (
                      <div className="text-center py-8 text-gray-600">
                        <p>{paymentMethod === 'paypal' ? 'PayPal' : paymentMethod === 'venmo' ? 'Venmo' : 'Apple Pay'} integration coming soon!</p>
                        <p className="mt-2">Please select another payment method.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                {isTestMode && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg mb-4 text-sm">
                    <strong>Test Mode:</strong> Using sample product for checkout testing
                  </div>
                )}
                <div className="space-y-2 mb-4">
                  {effectiveItems.map((item) => (
                    <div key={(item as any).id || item.product.id} className="text-sm">
                      <div className="flex justify-between">
                        <span>{item.product.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                      {item.customization && (
                        <div className="text-xs text-gray-600 ml-2">
                          {item.customization.engraving && (
                            <div>Engraving: {item.customization.engraving}</div>
                          )}
                          {item.customization && 'colors' in item.customization && (item.customization as any).colors && Array.isArray((item.customization as any).colors) && (item.customization as any).colors.length > 0 && (
                            <div>Colors: {(item.customization as any).colors.join(', ')}</div>
                          )}
                          {item.customization.finish && (
                            <div>Finish: {item.customization.finish}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${effectiveTotalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {checkoutStep === 1 ? (
                          <span className="text-gray-500">Enter address</span>
                        ) : (
                          `$${shippingCost.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {selectedShipping && (
                      <div className="text-xs text-gray-600 text-right">
                        {selectedShipping}
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-nub-gold">
                          {checkoutStep === 1 ? (
                            <span className="text-gray-500">TBD</span>
                          ) : (
                            `$${total.toFixed(2)}`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Address Summary */}
                  {checkoutStep >= 2 && (
                    <div className="mt-6 pt-4 border-t">
                      <h3 className="font-semibold mb-2">Shipping To:</h3>
                      <div className="text-sm text-gray-600">
                        <div>{shippingAddress.line1}</div>
                        {shippingAddress.line2 && <div>{shippingAddress.line2}</div>}
                        <div>
                          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}