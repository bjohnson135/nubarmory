import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

// POST update material-color association
export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { materialId, colorId, isAvailable, isDefault, priceModifier } = await request.json()

    if (!materialId || !colorId) {
      return NextResponse.json(
        { error: 'Material ID and Color ID are required' },
        { status: 400 }
      )
    }

    // Check if the association exists
    const existing = await prisma.materialColor.findUnique({
      where: {
        materialId_colorId: {
          materialId,
          colorId
        }
      }
    })

    if (existing) {
      // Update existing
      const updated = await prisma.materialColor.update({
        where: {
          id: existing.id
        },
        data: {
          isAvailable: isAvailable !== undefined ? isAvailable : existing.isAvailable,
          isDefault: isDefault !== undefined ? isDefault : existing.isDefault,
          priceModifier: priceModifier !== undefined ? priceModifier : existing.priceModifier
        }
      })
      return NextResponse.json({ materialColor: updated })
    } else {
      // Create new association
      const created = await prisma.materialColor.create({
        data: {
          materialId,
          colorId,
          isAvailable: isAvailable !== undefined ? isAvailable : true,
          isDefault: isDefault || false,
          priceModifier: priceModifier || 0
        }
      })
      return NextResponse.json({ materialColor: created })
    }
  } catch (error) {
    console.error('Error updating material color:', error)
    return NextResponse.json(
      { error: 'Failed to update material color' },
      { status: 500 }
    )
  }
}

// DELETE remove material-color association
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')
    const colorId = searchParams.get('colorId')

    if (!materialId || !colorId) {
      return NextResponse.json(
        { error: 'Material ID and Color ID are required' },
        { status: 400 }
      )
    }

    await prisma.materialColor.delete({
      where: {
        materialId_colorId: {
          materialId,
          colorId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting material color:', error)
    return NextResponse.json(
      { error: 'Failed to delete material color' },
      { status: 500 }
    )
  }
}