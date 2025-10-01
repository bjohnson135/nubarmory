import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { PrismaClient } from '@prisma/client'
import { sendOrderConfirmationEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('Payment succeeded:', paymentIntent.id)

        // Find the order by payment intent ID
        const order = await prisma.order.findFirst({
          where: { paymentIntentId: paymentIntent.id },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        })

        if (order) {
          // Update order status to confirmed
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'confirmed' }
          })

          // Send order confirmation email
          const orderDetails = {
            id: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            total: order.total,
            createdAt: order.createdAt,
            shippingAddress: order.shippingAddress,
            items: order.items.map(item => ({
              productName: item.product.name,
              quantity: item.quantity,
              price: item.price,
              customization: typeof item.customization === 'string' ? item.customization : JSON.stringify(item.customization) || undefined
            }))
          }

          const emailResult = await sendOrderConfirmationEmail(orderDetails)
          if (emailResult.success) {
            console.log('Order confirmation email sent for order:', order.id)
          } else {
            console.error('Failed to send confirmation email for order:', order.id, emailResult.error)
          }
        } else {
          console.error('Order not found for payment intent:', paymentIntent.id)
        }
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('Payment failed:', failedPayment.id)

        // Update order status to failed
        await prisma.order.updateMany({
          where: { paymentIntentId: failedPayment.id },
          data: { status: 'failed' }
        })
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}