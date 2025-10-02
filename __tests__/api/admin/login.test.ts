/**
 * Admin Login API Endpoint Tests
 *
 * Tests the admin login API route for:
 * - Successful authentication
 * - Failed authentication scenarios
 * - JWT token creation and cookie setting
 * - Error handling and security measures
 * - Production readiness
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/login/route'

// Mock authentication functions
jest.mock('@/lib/auth', () => ({
  authenticateAdmin: jest.fn(),
  createToken: jest.fn()
}))

// Get mocked functions for test setup
import * as auth from '@/lib/auth'
const mockAuthenticateAdmin = auth.authenticateAdmin as jest.MockedFunction<typeof auth.authenticateAdmin>
const mockCreateToken = auth.createToken as jest.MockedFunction<typeof auth.createToken>

describe('Admin Login API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body)
    } as unknown as NextRequest
  }

  describe('Successful Authentication', () => {
    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
      name: 'Test Admin'
    }

    const mockToken = 'mock.jwt.token'

    beforeEach(() => {
      mockAuthenticateAdmin.mockResolvedValue(mockAdminUser)
      mockCreateToken.mockReturnValue(mockToken)
    })

    it('should authenticate valid credentials', async () => {
      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'correctPassword'
      })

      const response = await POST(request)
      const responseData = await response.json()

      console.log('Response status:', response.status)
      console.log('Response data:', responseData)
      console.log('Mock calls:', mockAuthenticateAdmin.mock.calls, mockCreateToken.mock.calls)

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.admin).toEqual({
        id: mockAdminUser.id,
        email: mockAdminUser.email,
        name: mockAdminUser.name
      })

      expect(mockAuthenticateAdmin).toHaveBeenCalledWith(
        'admin@test.com',
        'correctPassword'
      )
      expect(mockCreateToken).toHaveBeenCalledWith(mockAdminUser)
    })

    it('should set secure HTTP-only cookie', async () => {
      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'correctPassword'
      })

      const response = await POST(request)

      // Check Set-Cookie header
      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toBeTruthy()
      expect(setCookieHeader).toContain('adminToken=' + mockToken)
      expect(setCookieHeader).toContain('HttpOnly')
      expect(setCookieHeader).toContain('Secure')
      expect(setCookieHeader).toContain('SameSite=Strict')
      expect(setCookieHeader).toContain('Max-Age=604800') // 7 days
      expect(setCookieHeader).toContain('Path=/')
    })

    it('should handle different email formats', async () => {
      const testEmails = [
        'admin@test.com',
        'ADMIN@TEST.COM',
        'admin.user@test-domain.co.uk',
        'admin+test@test.com'
      ]

      for (const email of testEmails) {
        mockAuthenticateAdmin.mockResolvedValue(mockAdminUser)

        const request = createMockRequest({
          email,
          password: 'password'
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
        expect(mockAuthenticateAdmin).toHaveBeenCalledWith(email, 'password')
      }
    })

    it('should handle special characters in password', async () => {
      const specialPassword = 'p@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?'

      const request = createMockRequest({
        email: 'admin@test.com',
        password: specialPassword
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockAuthenticateAdmin).toHaveBeenCalledWith(
        'admin@test.com',
        specialPassword
      )
    })
  })

  describe('Authentication Failures', () => {
    beforeEach(() => {
      mockAuthenticateAdmin.mockResolvedValue(null) // Failed authentication
    })

    it('should reject invalid credentials', async () => {
      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'wrongPassword'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Invalid credentials')
      expect(responseData.admin).toBeUndefined()

      expect(mockAuthenticateAdmin).toHaveBeenCalledWith(
        'admin@test.com',
        'wrongPassword'
      )
      expect(mockCreateToken).not.toHaveBeenCalled()
    })

    it('should reject non-existent email', async () => {
      const request = createMockRequest({
        email: 'nonexistent@test.com',
        password: 'password'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Invalid credentials')
    })

    it('should not set cookie on failed authentication', async () => {
      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'wrongPassword'
      })

      const response = await POST(request)

      const setCookieHeader = response.headers.get('Set-Cookie')
      expect(setCookieHeader).toBeFalsy()
    })
  })

  describe('Input Validation', () => {
    it('should require email field', async () => {
      const request = createMockRequest({
        password: 'password'
        // missing email
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Email and password are required')
      expect(mockAuthenticateAdmin).not.toHaveBeenCalled()
    })

    it('should require password field', async () => {
      const request = createMockRequest({
        email: 'admin@test.com'
        // missing password
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Email and password are required')
      expect(mockAuthenticateAdmin).not.toHaveBeenCalled()
    })

    it('should reject empty email', async () => {
      const request = createMockRequest({
        email: '',
        password: 'password'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Email and password are required')
    })

    it('should reject empty password', async () => {
      const request = createMockRequest({
        email: 'admin@test.com',
        password: ''
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Email and password are required')
    })

    it('should handle whitespace-only input', async () => {
      const request = createMockRequest({
        email: '   ',
        password: '   '
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Email and password are required')
    })

    it('should handle null values', async () => {
      const request = createMockRequest({
        email: null,
        password: null
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.error).toBe('Email and password are required')
    })
  })

  describe('Error Handling', () => {
    it('should handle authentication service errors', async () => {
      mockAuthenticateAdmin.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'password'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Internal server error')
      expect(responseData.admin).toBeUndefined()
    })

    it('should handle token creation errors', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin'
      }

      mockAuthenticateAdmin.mockResolvedValue(mockAdminUser)
      mockCreateToken.mockImplementation(() => {
        throw new Error('Token creation failed')
      })

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'password'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Internal server error')
    })

    it('should handle malformed JSON request', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBe('Invalid request format')
    })

    it('should not leak sensitive information in error messages', async () => {
      mockAuthenticateAdmin.mockRejectedValue(new Error('Admin password hash: $2b$12$...'))

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'password'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.error).toBe('Internal server error')
      expect(responseData.error).not.toContain('$2b$12$')
      expect(responseData.error).not.toContain('password')
      expect(responseData.error).not.toContain('hash')
    })
  })

  describe('Security Measures', () => {
    it('should not expose admin password hash in response', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin'
      }

      mockAuthenticateAdmin.mockResolvedValue(mockAdminUser)
      mockCreateToken.mockReturnValue('token')

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'password'
      })

      const response = await POST(request)
      const responseData = await response.json()
      const responseText = JSON.stringify(responseData)

      expect(responseText).not.toContain('password')
      expect(responseText).not.toContain('passwordHash')
      expect(responseText).not.toContain('$2b$')
    })

    it('should use consistent response format for failed auth', async () => {
      const testCases = [
        { email: 'nonexistent@test.com', password: 'password' },
        { email: 'admin@test.com', password: 'wrongpassword' },
        { email: 'invalid-email', password: 'password' }
      ]

      for (const testCase of testCases) {
        mockAuthenticateAdmin.mockResolvedValue(null)

        const request = createMockRequest(testCase)
        const response = await POST(request)
        const responseData = await response.json()

        expect(response.status).toBe(401)
        expect(responseData.success).toBe(false)
        expect(responseData.error).toBe('Invalid credentials')
        expect(responseData.admin).toBeUndefined()
      }
    })

    it('should handle concurrent login attempts', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin'
      }

      mockAuthenticateAdmin.mockResolvedValue(mockAdminUser)
      mockCreateToken.mockReturnValue('token')

      // Simulate multiple concurrent requests
      const requests = Array(5).fill(null).map(() =>
        createMockRequest({
          email: 'admin@test.com',
          password: 'password'
        })
      )

      const responses = await Promise.all(
        requests.map(request => POST(request))
      )

      // All should succeed
      for (const response of responses) {
        expect(response.status).toBe(200)
        const responseData = await response.json()
        expect(responseData.success).toBe(true)
      }
    })
  })

  describe('Cookie Configuration', () => {
    it('should set cookie with correct security attributes', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin'
      }

      mockAuthenticateAdmin.mockResolvedValue(mockAdminUser)
      mockCreateToken.mockReturnValue('secure.jwt.token')

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'password'
      })

      const response = await POST(request)
      const setCookieHeader = response.headers.get('Set-Cookie')

      expect(setCookieHeader).toContain('adminToken=secure.jwt.token')
      expect(setCookieHeader).toContain('HttpOnly') // Prevent XSS
      expect(setCookieHeader).toContain('Secure') // HTTPS only
      expect(setCookieHeader).toContain('SameSite=Strict') // CSRF protection
      expect(setCookieHeader).toContain('Path=/') // Site-wide access
      expect(setCookieHeader).toContain('Max-Age=604800') // 7 days
    })

    it('should set correct cookie expiration', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin'
      }

      mockAuthenticateAdmin.mockResolvedValue(mockAdminUser)
      mockCreateToken.mockReturnValue('token')

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'password'
      })

      const response = await POST(request)
      const setCookieHeader = response.headers.get('Set-Cookie')

      // 7 days = 7 * 24 * 60 * 60 = 604800 seconds
      expect(setCookieHeader).toContain('Max-Age=604800')
    })
  })

  describe('Response Format', () => {
    it('should return consistent success response format', async () => {
      const mockAdminUser = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin'
      }

      mockAuthenticateAdmin.mockResolvedValue(mockAdminUser)
      mockCreateToken.mockReturnValue('token')

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'password'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData).toHaveProperty('success', true)
      expect(responseData).toHaveProperty('admin')
      expect(responseData.admin).toHaveProperty('id')
      expect(responseData.admin).toHaveProperty('email')
      expect(responseData.admin).toHaveProperty('name')
      expect(responseData).not.toHaveProperty('error')
    })

    it('should return consistent error response format', async () => {
      mockAuthenticateAdmin.mockResolvedValue(null)

      const request = createMockRequest({
        email: 'admin@test.com',
        password: 'wrongpassword'
      })

      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData).toHaveProperty('success', false)
      expect(responseData).toHaveProperty('error')
      expect(responseData).not.toHaveProperty('admin')
    })
  })
})