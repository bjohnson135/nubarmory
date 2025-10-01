import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

// GET all colors
export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const colors = await prisma.color.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ colors })
  } catch (error) {
    console.error('Error fetching colors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch colors' },
      { status: 500 }
    )
  }
}

// POST create new color
export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, displayName, hexCode, description, isSpecial } = await request.json()

    if (!name || !displayName || !hexCode) {
      return NextResponse.json(
        { error: 'Name, display name, and hex code are required' },
        { status: 400 }
      )
    }

    // Get the highest sort order
    const lastColor = await prisma.color.findFirst({
      orderBy: { sortOrder: 'desc' }
    })
    const nextSortOrder = (lastColor?.sortOrder || 0) + 1

    const color = await prisma.color.create({
      data: {
        name,
        displayName,
        hexCode,
        description: description || null,
        isSpecial: isSpecial || false,
        sortOrder: nextSortOrder
      }
    })

    return NextResponse.json({ color })
  } catch (error) {
    console.error('Error creating color:', error)
    return NextResponse.json(
      { error: 'Failed to create color' },
      { status: 500 }
    )
  }
}