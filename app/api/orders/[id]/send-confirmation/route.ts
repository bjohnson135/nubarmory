import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendOrderConfirmationEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email') ||
        !process.env.EMAIL_PASSWORD || process.env.EMAIL_PASSWORD.includes('your-app-password')) {
      console.log('Email not configured - skipping confirmation email')
      return NextResponse.json({
        success: false,
        message: 'Email not configured'
      })
    }

    // Prepare order details for email
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
        customization: item.customization || undefined
      }))
    }

    const emailResult = await sendOrderConfirmationEmail(orderDetails)

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Confirmation email sent',
        messageId: emailResult.messageId
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send email',
        error: emailResult.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return NextResponse.json(
      { error: 'Failed to send confirmation email' },
      { status: 500 }
    )
  }
}