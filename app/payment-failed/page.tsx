'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Shield, XCircle, ArrowLeft, RefreshCw, CreditCard } from 'lucide-react'

export default function PaymentFailed() {
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  const paymentIntentId = searchParams.get('payment_intent')
  const errorMessage = searchParams.get('error') || 'Your payment could not be processed'

  useEffect(() => {
    setError(errorMessage)
  }, [errorMessage])

  const handleRetryPayment = () => {
    // Redirect back to checkout with cart intact
    router.push('/checkout')
  }

  const handleBackToCart = () => {
    router.push('/cart')
  }

  const getErrorDetails = (errorMsg: string) => {
    const lowerError = errorMsg.toLowerCase()

    if (lowerError.includes('insufficient funds') || lowerError.includes('declined')) {
      return {
        title: 'Payment Declined',
        suggestions: [
          'Check that you have sufficient funds available',
          'Verify your card details are correct',
          'Try a different payment method',
          'Contact your bank if the issue persists'
        ]
      }
    } else if (lowerError.includes('expired') || lowerError.includes('expir')) {
      return {
        title: 'Card Expired',
        suggestions: [
          'Check your card expiration date',
          'Use a different card that hasn\'t expired',
          'Contact your card issuer for a replacement'
        ]
      }
    } else if (lowerError.includes('network') || lowerError.includes('connection')) {
      return {
        title: 'Connection Error',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ]
      }
    } else {
      return {
        title: 'Payment Error',
        suggestions: [
          'Double-check your payment information',
          'Try a different payment method',
          'Contact support if the issue continues',
          'Clear your browser cache and try again'
        ]
      }
    }
  }

  const errorDetails = getErrorDetails(error)

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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Message */}
        <div className="text-center mb-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-lg text-gray-600">
            We were unable to process your payment. Don&apos;t worry - your order hasn&apos;t been charged.
          </p>
        </div>

        {/* Error Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="border-l-4 border-red-400 pl-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{errorDetails.title}</h2>
            <p className="text-gray-600">{error}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">How to resolve this:</h3>
            <ul className="space-y-2">
              {errorDetails.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3"></div>
                  <span className="text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment Intent Debug Info (only show in development) */}
        {process.env.NODE_ENV === 'development' && paymentIntentId && (
          <div className="bg-gray-100 rounded-lg p-4 mb-8">
            <h3 className="font-medium text-gray-900 mb-2">Debug Information</h3>
            <p className="text-sm text-gray-600">Payment Intent ID: {paymentIntentId}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleRetryPayment}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Payment Again
          </button>

          <button
            onClick={handleBackToCart}
            className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Cart
          </button>
        </div>

        {/* Alternative Payment Methods */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <CreditCard className="h-6 w-6 text-blue-600 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">Having trouble with payments?</h3>
              <p className="text-blue-700 mb-3">
                We accept multiple payment methods to make your purchase as convenient as possible.
              </p>
              <ul className="text-blue-700 space-y-1">
                <li>• Credit and debit cards (Visa, Mastercard, American Express)</li>
                <li>• Digital wallets (Apple Pay, Google Pay)</li>
                <li>• PayPal (coming soon)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Still having issues? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@nubarmory.com"
              className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Email Support
            </a>
            <span className="hidden sm:inline text-gray-400">•</span>
            <button
              onClick={() => router.push('/')}
              className="text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Return to Store
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}