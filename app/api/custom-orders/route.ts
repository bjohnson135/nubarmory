import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const customOrder = await prisma.customOrder.create({
      data: {
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        description: data.description,
        budget: data.budget,
        timeline: data.timeline,
        referenceImages: data.referenceImages || [],
        status: 'pending'
      }
    })

    return NextResponse.json({ success: true, orderId: customOrder.id })
  } catch (error) {
    console.error('Error creating custom order:', error)
    return NextResponse.json(
      { error: 'Failed to create custom order' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const orders = await prisma.customOrder.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching custom orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom orders' },
      { status: 500 }
    )
  }
}