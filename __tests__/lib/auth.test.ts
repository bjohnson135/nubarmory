/**
 * Authentication Library Tests
 *
 * Tests the core authentication functions including:
 * - Password hashing and verification
 * - JWT token creation and validation
 * - Admin user authentication flow
 * - Error handling and edge cases
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  authenticateAdmin,
  createAdminUser,
  AdminUser
} from '@/lib/auth'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    admin: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}))

// Get mocked functions for test setup
import { prisma } from '@/lib/prisma'
const mockAdminFindUnique = prisma.admin.findUnique as jest.MockedFunction<typeof prisma.admin.findUnique>
const mockAdminCreate = prisma.admin.create as jest.MockedFunction<typeof prisma.admin.create>

// Mock environment
const originalEnv = process.env
beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
})

afterAll(() => {
  process.env = originalEnv
})

describe('Authentication Library', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Password Hashing', () => {
    it('should hash passwords securely', async () => {
      const password = 'testPassword123'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(50) // bcrypt hashes are long
      expect(hashedPassword).toMatch(/^\$2[aby]\$/) // bcrypt format
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'samePassword'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // Salt should make them different
    })

    it('should handle special characters in passwords', async () => {
      const specialPassword = 'p@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?'
      const hashedPassword = await hashPassword(specialPassword)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(specialPassword)
    })

    it('should handle empty password', async () => {
      const emptyPassword = ''
      const hashedPassword = await hashPassword(emptyPassword)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe('')
    })
  })

  describe('Password Verification', () => {
    it('should verify correct passwords', async () => {
      const password = 'correctPassword'
      const hashedPassword = await hashPassword(password)
      const isValid = await verifyPassword(password, hashedPassword)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const correctPassword = 'correctPassword'
      const wrongPassword = 'wrongPassword'
      const hashedPassword = await hashPassword(correctPassword)
      const isValid = await verifyPassword(wrongPassword, hashedPassword)

      expect(isValid).toBe(false)
    })

    it('should handle case-sensitive passwords', async () => {
      const password = 'CaseSensitive'
      const hashedPassword = await hashPassword(password)

      const validCase = await verifyPassword('CaseSensitive', hashedPassword)
      const invalidCase = await verifyPassword('casesensitive', hashedPassword)

      expect(validCase).toBe(true)
      expect(invalidCase).toBe(false)
    })

    it('should handle malformed hashes gracefully', async () => {
      const password = 'testPassword'
      const malformedHash = 'not-a-real-hash'

      const isValid = await verifyPassword(password, malformedHash)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Management', () => {
    const mockAdminUser: AdminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
      name: 'Test Admin'
    }

    it('should create valid JWT tokens', () => {
      const token = createToken(mockAdminUser)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include user data in token', () => {
      const token = createToken(mockAdminUser)
      const verified = verifyToken(token) // Use our own verifyToken function

      expect(verified).not.toBeNull()
      expect(verified!.id).toBe(mockAdminUser.id)
      expect(verified!.email).toBe(mockAdminUser.email)
      expect(verified!.name).toBe(mockAdminUser.name)
    })

    it('should verify valid tokens', () => {
      const token = createToken(mockAdminUser)
      const verified = verifyToken(token)

      expect(verified).not.toBeNull()
      expect(verified!.id).toBe(mockAdminUser.id)
      expect(verified!.email).toBe(mockAdminUser.email)
      expect(verified!.name).toBe(mockAdminUser.name)
    })

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.jwt.token'
      const verified = verifyToken(invalidToken)

      expect(verified).toBeNull()
    })

    it('should reject tokens with wrong secret', () => {
      const wrongSecretToken = jwt.sign(mockAdminUser, 'wrong-secret')
      const verified = verifyToken(wrongSecretToken)

      expect(verified).toBeNull()
    })

    it('should reject expired tokens', () => {
      const expiredToken = jwt.sign(
        { ...mockAdminUser, exp: Math.floor(Date.now() / 1000) - 3600 }, // 1 hour ago
        process.env.JWT_SECRET!
      )
      const verified = verifyToken(expiredToken)

      expect(verified).toBeNull()
    })

    it('should handle malformed tokens gracefully', () => {
      const malformedTokens = [
        '',
        'not-a-token',
        'missing.parts',
        'too.many.parts.here.invalid'
      ]

      malformedTokens.forEach(token => {
        const verified = verifyToken(token)
        expect(verified).toBeNull()
      })
    })
  })

  describe('Admin Authentication', () => {
    const mockAdmin = {
      id: 'admin-123',
      email: 'admin@test.com',
      name: 'Test Admin',
      passwordHash: '$2b$12$test.hash.here'
    }

    beforeEach(() => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true))
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should authenticate valid admin credentials', async () => {
      mockAdminFindUnique.mockResolvedValue(mockAdmin)

      const result = await authenticateAdmin('admin@test.com', 'correctPassword')

      expect(result).not.toBeNull()
      expect(result!.id).toBe(mockAdmin.id)
      expect(result!.email).toBe(mockAdmin.email)
      expect(result!.name).toBe(mockAdmin.name)
      expect(mockAdminFindUnique).toHaveBeenCalledWith({
        where: { email: 'admin@test.com' }
      })
    })

    it('should reject invalid email', async () => {
      mockAdminFindUnique.mockResolvedValue(null)

      const result = await authenticateAdmin('nonexistent@test.com', 'password')

      expect(result).toBeNull()
      expect(mockAdminFindUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@test.com' }
      })
    })

    it('should reject invalid password', async () => {
      mockAdminFindUnique.mockResolvedValue(mockAdmin)
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false))

      const result = await authenticateAdmin('admin@test.com', 'wrongPassword')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      mockAdminFindUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(authenticateAdmin('admin@test.com', 'password'))
        .rejects.toThrow('Database connection failed')
    })

    it('should be case sensitive for email', async () => {
      mockAdminFindUnique.mockResolvedValue(null)

      await authenticateAdmin('ADMIN@TEST.COM', 'password')

      expect(mockAdminFindUnique).toHaveBeenCalledWith({
        where: { email: 'ADMIN@TEST.COM' }
      })
    })

    it('should handle empty credentials', async () => {
      mockAdminFindUnique.mockResolvedValue(null)

      const result = await authenticateAdmin('', '')

      expect(result).toBeNull()
      expect(mockAdminFindUnique).toHaveBeenCalledWith({
        where: { email: '' }
      })
    })
  })

  describe('Admin User Creation', () => {
    it('should create admin user with hashed password', async () => {
      const mockCreatedAdmin = {
        id: 'new-admin-id',
        email: 'new@admin.com',
        name: 'New Admin',
        passwordHash: '$2b$12$hashedpassword'
      }

      mockAdminCreate.mockResolvedValue(mockCreatedAdmin)

      const result = await createAdminUser('new@admin.com', 'password123', 'New Admin')

      expect(result).toBe(mockCreatedAdmin)
      expect(mockAdminCreate).toHaveBeenCalledWith({
        data: {
          email: 'new@admin.com',
          passwordHash: expect.stringMatching(/^\$2[aby]\$/), // bcrypt format
          name: 'New Admin'
        }
      })
    })

    it('should handle duplicate email errors', async () => {
      mockAdminCreate.mockRejectedValue(new Error('Unique constraint failed'))

      await expect(createAdminUser('existing@admin.com', 'password', 'Admin'))
        .rejects.toThrow('Unique constraint failed')
    })

    it('should hash password before storing', async () => {
      mockAdminCreate.mockImplementation((data) => {
        // Verify password was hashed
        expect(data.data.passwordHash).not.toBe('plainPassword')
        expect(data.data.passwordHash).toMatch(/^\$2[aby]\$/)
        return Promise.resolve({ id: 'test', ...data.data })
      })

      await createAdminUser('test@admin.com', 'plainPassword', 'Test Admin')

      expect(mockAdminCreate).toHaveBeenCalled()
    })
  })

  describe('Environment Configuration', () => {
    it('should use custom JWT secret when provided', () => {
      const customSecret = 'custom-jwt-secret'
      const originalSecret = process.env.JWT_SECRET
      process.env.JWT_SECRET = customSecret

      const mockUser: AdminUser = { id: '1', email: 'test@test.com', name: 'Test' }

      // Need to reload the module to pick up the new environment variable
      jest.isolateModules(() => {
        const { createToken, verifyToken } = require('@/lib/auth')
        const token = createToken(mockUser)
        const verified = verifyToken(token)

        expect(verified).not.toBeNull()
        expect(verified.id).toBe('1')
      })

      // Restore original secret
      process.env.JWT_SECRET = originalSecret
    })

    it('should fall back to default JWT secret', () => {
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      const mockUser: AdminUser = { id: '1', email: 'test@test.com', name: 'Test' }

      // Should not throw error even without JWT_SECRET
      expect(() => createToken(mockUser)).not.toThrow()

      // Restore original secret
      process.env.JWT_SECRET = originalSecret
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete authentication flow', async () => {
      // Create admin
      const password = 'securePassword123'
      const hashedPassword = await hashPassword(password)

      const mockAdmin = {
        id: 'flow-test-id',
        email: 'flow@test.com',
        name: 'Flow Test Admin',
        passwordHash: hashedPassword
      }

      mockAdminFindUnique.mockResolvedValue(mockAdmin)

      // Authenticate
      const authenticatedUser = await authenticateAdmin('flow@test.com', password)
      expect(authenticatedUser).not.toBeNull()

      // Create token
      const token = createToken(authenticatedUser!)
      expect(token).toBeDefined()

      // Verify token
      const verifiedUser = verifyToken(token)
      expect(verifiedUser).not.toBeNull()
      expect(verifiedUser!.email).toBe('flow@test.com')
    })

    it('should handle authentication failure flow', async () => {
      mockAdminFindUnique.mockResolvedValue(null)

      const authenticatedUser = await authenticateAdmin('nonexistent@test.com', 'password')
      expect(authenticatedUser).toBeNull()

      // Should not create token for failed authentication
      // This would be handled in the route handler
    })

    it('should handle concurrent authentication requests', async () => {
      const password = 'password123'
      const hashedPassword = await hashPassword(password)

      const mockAdmin = {
        id: 'concurrent-test',
        email: 'concurrent@test.com',
        name: 'Concurrent Test',
        passwordHash: hashedPassword
      }

      mockAdminFindUnique.mockResolvedValue(mockAdmin)

      // Simulate multiple concurrent login attempts
      const authPromises = Array(5).fill(null).map(() =>
        authenticateAdmin('concurrent@test.com', password)
      )

      const results = await Promise.all(authPromises)

      // All should succeed
      results.forEach(result => {
        expect(result).not.toBeNull()
        expect(result!.email).toBe('concurrent@test.com')
      })
    })
  })
})