import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  try {
    const { materialId } = await params

    const materialColors = await prisma.materialColor.findMany({
      where: {
        materialId,
        isAvailable: true
      },
      include: {
        color: true
      },
      orderBy: {
        color: {
          sortOrder: 'asc'
        }
      }
    })

    const colors = materialColors.map(mc => ({
      ...mc.color,
      isDefault: mc.isDefault,
      priceModifier: mc.priceModifier
    }))

    return NextResponse.json({ colors })
  } catch (error) {
    console.error('Error fetching material colors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch material colors' },
      { status: 500 }
    )
  }
}