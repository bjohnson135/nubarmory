import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const { email, password } = body

    // Check for missing, empty, or whitespace-only values
    if (!email || !password || !email.trim() || !password.trim()) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const admin = await authenticateAdmin(email, password)

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = createToken(admin)

    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name }
    })

    // Set HTTP-only cookie with correct name and security attributes
    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: true, // Always secure for production readiness
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}