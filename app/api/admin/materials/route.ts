import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

// GET all materials with their colors
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        colors: {
          include: {
            color: true
          }
        }
      }
    })

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

// POST create new material
export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, displayName, description } = await request.json()

    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and display name are required' },
        { status: 400 }
      )
    }

    // Get the highest sort order
    const lastMaterial = await prisma.material.findFirst({
      orderBy: { sortOrder: 'desc' }
    })
    const nextSortOrder = (lastMaterial?.sortOrder || 0) + 1

    const material = await prisma.material.create({
      data: {
        name,
        displayName,
        description: description || null,
        sortOrder: nextSortOrder
      }
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}