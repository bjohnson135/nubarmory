import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const {
      name,
      description,
      price,
      category,
      images,
      stockQuantity,
      lowStockThreshold,
      manufacturingTime,
      materialId,
      numberOfColors,
      modelFile,
      features,
      finish,
      customizable,
      modelOrientation
    } = await request.json()

    if (!name || !description || !price || stockQuantity === undefined) {
      return NextResponse.json(
        { error: 'Name, description, price, and stock quantity are required' },
        { status: 400 }
      )
    }

    const stockQty = parseInt(stockQuantity) || 0
    const lowStockAlert = parseInt(lowStockThreshold) || 5
    const numColors = parseInt(numberOfColors) || 1

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        images: images || [],
        category: category.toLowerCase(),
        materialId: materialId || null,
        finish: finish || 'Standard',
        numberOfColors: numColors,
        modelFile: modelFile || null,
        availableColors: [],
        colorZones: [],
        inStock: stockQty > 0,
        stockQuantity: stockQty,
        lowStockThreshold: lowStockAlert,
        manufacturingTime: manufacturingTime || null,
        customizable: customizable !== undefined ? customizable : false,
        features: features || [],
        modelOrientation: modelOrientation || null
      }
    })

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        images: product.images as string[],
        features: product.features as string[]
      }
    })

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        material: true
      }
    })

    const formattedProducts = products.map(product => ({
      ...product,
      images: product.images as string[],
      features: product.features as string[]
    }))

    return NextResponse.json({ products: formattedProducts })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}