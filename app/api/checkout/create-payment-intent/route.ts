import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { items, customerInfo, shippingAddress } = await request.json()

    const TAX_RATE = 0.08
    const SHIPPING = 9.99

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0
    )
    const tax = subtotal * TAX_RATE
    const total = subtotal + tax + SHIPPING

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        items: JSON.stringify(items.map((item: any) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          customization: item.customization
        })))
      }
    })

    const order = await prisma.order.create({
      data: {
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        shippingAddress: shippingAddress,
        subtotal,
        tax,
        shipping: SHIPPING,
        total,
        paymentMethod: 'stripe',
        paymentIntentId: paymentIntent.id,
        status: 'pending',
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            customization: item.customization || null
          }))
        }
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}