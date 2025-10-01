import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type for 3D models
    const allowedExtensions = ['.stl', '.STL', '.3mf', '.3MF']
    const fileName = file.name.toLowerCase()
    const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext.toLowerCase()))

    if (!isValidType) {
      return NextResponse.json({
        error: 'File must be a 3D model (.stl or .3mf)'
      }, { status: 400 })
    }

    // Validate file size (max 50MB for 3D models)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File size must be less than 50MB'
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `model-${timestamp}.${extension}`

    // Save to public/models directory
    const uploadDir = join(process.cwd(), 'public', 'models')
    const filePath = join(uploadDir, filename)

    // Create models directory if it doesn't exist
    try {
      await writeFile(filePath, buffer)
    } catch (error) {
      // If directory doesn't exist, create it
      const { mkdir } = await import('fs/promises')
      await mkdir(uploadDir, { recursive: true })
      await writeFile(filePath, buffer)
    }

    // Return the public URL
    const modelUrl = `/models/${filename}`

    return NextResponse.json({
      success: true,
      modelUrl: modelUrl,
      filename: filename,
      size: file.size
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}