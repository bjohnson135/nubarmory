import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '@/lib/auth'

const prisma = new PrismaClient()

// GET single product
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        material: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({
      product: {
        ...product,
        images: product.images as string[],
        features: product.features as string[]
      }
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT update product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const {
      name,
      description,
      price,
      category,
      image,
      stockQuantity,
      lowStockThreshold,
      manufacturingTime,
      weightOz,
      lengthIn,
      widthIn,
      heightIn,
      material,
      numberOfColors,
      availableColors,
      modelOrientation,
      modelFile,
      finish,
      customizable,
      features
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        images: image ? [image] : [],
        category: category.toLowerCase(),
        inStock: stockQty > 0,
        stockQuantity: stockQty,
        lowStockThreshold: lowStockAlert,
        manufacturingTime: manufacturingTime || null,
        weightOz: weightOz ? parseFloat(weightOz) : null,
        lengthIn: lengthIn ? parseFloat(lengthIn) : null,
        widthIn: widthIn ? parseFloat(widthIn) : null,
        heightIn: heightIn ? parseFloat(heightIn) : null,
        materialId: material || null,
        numberOfColors: numColors,
        availableColors: availableColors || [],
        modelOrientation: modelOrientation || null,
        modelFile: modelFile || null,
        finish: finish || 'Standard',
        customizable: customizable !== undefined ? customizable : false,
        features: features || [],
        updatedAt: new Date()
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
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get('admin-token')?.value

  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete the product
    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}