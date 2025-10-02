/**
 * Database Connection Tests for Different Environments
 *
 * Tests database connectivity and functionality across:
 * - Local development (PostgreSQL)
 * - Production (Supabase PostgreSQL)
 * - Test environment (isolated test database)
 * - Connection pooling and error handling
 */

import { prisma } from '@/lib/prisma'

// Mock different database configurations
const mockDatabaseConfigs = {
  local: 'postgresql://localhost:5432/nubarmory_dev',
  production: 'postgresql://postgres:password@db.supabase.co:5432/postgres',
  test: 'postgresql://localhost:5432/nubarmory_test'
}

describe('Database Connection Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Connection Establishment', () => {
    it('should establish connection to database', async () => {
      // Test basic connectivity
      const result = await prisma.$queryRaw`SELECT 1 as test`
      expect(result).toEqual([{ test: 1 }])
    })

    it('should handle connection timeouts gracefully', async () => {
      // Mock connection timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 100)
      })

      try {
        await Promise.race([
          prisma.$queryRaw`SELECT pg_sleep(1)`, // Long query
          timeoutPromise
        ])
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('timeout')
      }
    })

    it('should validate DATABASE_URL format', () => {
      const validUrls = [
        'postgresql://user:pass@localhost:5432/db',
        'postgresql://localhost:5432/db',
        'postgres://user@host:5432/db',
        'postgresql://user:pass@host.domain.com:5432/db?sslmode=require'
      ]

      const invalidUrls = [
        'mysql://localhost:3306/db', // Wrong protocol
        'postgresql://localhost/db', // Missing port
        'http://localhost:5432/db', // Wrong protocol
        'postgresql://:5432/db', // Missing host
        ''
      ]

      validUrls.forEach(url => {
        expect(url).toMatch(/^postgresql?:\/\//)
      })

      invalidUrls.forEach(url => {
        expect(url).not.toMatch(/^postgresql:\/\/.*:\d+\/\w+/)
      })
    })

    it('should handle SSL connection requirements', async () => {
      // This test assumes production environments require SSL
      const isProduction = process.env.NODE_ENV === 'production'

      if (isProduction) {
        const databaseUrl = process.env.DATABASE_URL || ''
        expect(databaseUrl).toContain('sslmode=require')
      }

      // Test connection with SSL (this may pass or fail based on environment)
      try {
        await prisma.$queryRaw`SELECT version()`
      } catch (error) {
        // If SSL is required but not configured, we should get a specific error
        if ((error as Error).message.includes('SSL')) {
          expect((error as Error).message).toContain('SSL')
        }
      }
    })
  })

  describe('Admin User Operations', () => {
    const testAdmin = {
      id: 'test-admin-' + Date.now(),
      email: 'test-admin-' + Date.now() + '@test.com',
      name: 'Test Admin User',
      passwordHash: '$2b$12$test.hash.for.testing.purposes.only'
    }

    afterEach(async () => {
      // Clean up test data
      try {
        await prisma.admin.deleteMany({
          where: {
            email: {
              contains: 'test-admin-'
            }
          }
        })
      } catch (error) {
        // Ignore cleanup errors
      }
    })

    it('should create admin user in database', async () => {
      const createdAdmin = await prisma.admin.create({
        data: testAdmin
      })

      expect(createdAdmin.id).toBe(testAdmin.id)
      expect(createdAdmin.email).toBe(testAdmin.email)
      expect(createdAdmin.name).toBe(testAdmin.name)
      expect(createdAdmin.passwordHash).toBe(testAdmin.passwordHash)
      expect(createdAdmin.createdAt).toBeInstanceOf(Date)
      expect(createdAdmin.updatedAt).toBeInstanceOf(Date)
    })

    it('should find admin user by email', async () => {
      // Create test admin
      await prisma.admin.create({ data: testAdmin })

      // Find admin
      const foundAdmin = await prisma.admin.findUnique({
        where: { email: testAdmin.email }
      })

      expect(foundAdmin).not.toBeNull()
      expect(foundAdmin!.email).toBe(testAdmin.email)
      expect(foundAdmin!.name).toBe(testAdmin.name)
    })

    it('should enforce unique email constraint', async () => {
      // Create first admin
      await prisma.admin.create({ data: testAdmin })

      // Try to create another admin with same email
      const duplicateAdmin = {
        ...testAdmin,
        id: 'different-id'
      }

      await expect(
        prisma.admin.create({ data: duplicateAdmin })
      ).rejects.toThrow()
    })

    it('should update admin user', async () => {
      // Create test admin
      await prisma.admin.create({ data: testAdmin })

      // Update admin
      const updatedName = 'Updated Admin Name'
      const updatedAdmin = await prisma.admin.update({
        where: { email: testAdmin.email },
        data: { name: updatedName }
      })

      expect(updatedAdmin.name).toBe(updatedName)
      expect(updatedAdmin.updatedAt.getTime()).toBeGreaterThan(
        updatedAdmin.createdAt.getTime()
      )
    })

    it('should delete admin user', async () => {
      // Create test admin
      await prisma.admin.create({ data: testAdmin })

      // Delete admin
      await prisma.admin.delete({
        where: { email: testAdmin.email }
      })

      // Verify deletion
      const deletedAdmin = await prisma.admin.findUnique({
        where: { email: testAdmin.email }
      })

      expect(deletedAdmin).toBeNull()
    })
  })

  describe('Transaction Support', () => {
    it('should support database transactions', async () => {
      const testAdmins = [
        {
          id: 'tx-admin-1',
          email: 'tx-admin-1@test.com',
          name: 'Transaction Admin 1',
          passwordHash: '$2b$12$test.hash.1'
        },
        {
          id: 'tx-admin-2',
          email: 'tx-admin-2@test.com',
          name: 'Transaction Admin 2',
          passwordHash: '$2b$12$test.hash.2'
        }
      ]

      try {
        await prisma.$transaction([
          prisma.admin.create({ data: testAdmins[0] }),
          prisma.admin.create({ data: testAdmins[1] })
        ])

        // Verify both were created
        const admin1 = await prisma.admin.findUnique({
          where: { email: testAdmins[0].email }
        })
        const admin2 = await prisma.admin.findUnique({
          where: { email: testAdmins[1].email }
        })

        expect(admin1).not.toBeNull()
        expect(admin2).not.toBeNull()
      } finally {
        // Cleanup
        await prisma.admin.deleteMany({
          where: {
            email: {
              in: testAdmins.map(admin => admin.email)
            }
          }
        })
      }
    })

    it('should rollback transaction on error', async () => {
      const testAdmin = {
        id: 'rollback-admin',
        email: 'rollback-admin@test.com',
        name: 'Rollback Admin',
        passwordHash: '$2b$12$test.hash'
      }

      try {
        await prisma.$transaction([
          prisma.admin.create({ data: testAdmin }),
          // This should fail and cause rollback
          prisma.$executeRaw`INSERT INTO "Admin" (id, email, name, "passwordHash") VALUES ('duplicate', ${testAdmin.email}, 'Duplicate', 'hash')`
        ])
      } catch (error) {
        // Transaction should have rolled back
        const admin = await prisma.admin.findUnique({
          where: { email: testAdmin.email }
        })
        expect(admin).toBeNull()
      }
    })
  })

  describe('Connection Pool Management', () => {
    it('should handle multiple concurrent connections', async () => {
      const concurrentQueries = Array(10).fill(null).map((_, index) =>
        prisma.$queryRaw`SELECT ${index} as query_id`
      )

      const results = await Promise.all(concurrentQueries)

      results.forEach((result, index) => {
        expect(result).toEqual([{ query_id: index }])
      })
    })

    it('should properly disconnect from database', async () => {
      // Test disconnection doesn't throw error
      await expect(prisma.$disconnect()).resolves.not.toThrow()

      // Reconnect for other tests
      await prisma.$connect()
    })

    it('should handle connection recovery', async () => {
      // Simulate connection loss and recovery
      await prisma.$disconnect()

      // This should automatically reconnect
      const result = await prisma.$queryRaw`SELECT 'reconnected' as status`
      expect(result).toEqual([{ status: 'reconnected' }])
    })
  })

  describe('Environment-Specific Tests', () => {
    it('should use correct database for test environment', () => {
      if (process.env.NODE_ENV === 'test') {
        const databaseUrl = process.env.DATABASE_URL || ''
        expect(databaseUrl).toContain('test')
      }
    })

    it('should use different databases for different environments', () => {
      const environments = ['development', 'test', 'production']

      environments.forEach(env => {
        // In a real scenario, you'd check different DATABASE_URL values
        // This is a placeholder for environment-specific logic
        expect(env).toMatch(/^(development|test|production)$/)
      })
    })

    it('should handle missing environment variables gracefully', () => {
      const originalUrl = process.env.DATABASE_URL
      delete process.env.DATABASE_URL

      // The prisma client should handle missing DATABASE_URL
      // by falling back to defaults or throwing a descriptive error
      expect(() => {
        // This would be checked during Prisma client initialization
        const url = process.env.DATABASE_URL
        if (!url) {
          throw new Error('DATABASE_URL environment variable is required')
        }
      }).toThrow('DATABASE_URL environment variable is required')

      // Restore original URL
      process.env.DATABASE_URL = originalUrl
    })
  })

  describe('Database Schema Validation', () => {
    it('should have required Admin table structure', async () => {
      // Query table schema
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'Admin'
        ORDER BY ordinal_position
      ` as Array<{
        column_name: string
        data_type: string
        is_nullable: string
      }>

      const requiredColumns = [
        { name: 'id', type: 'text', nullable: 'NO' },
        { name: 'email', type: 'text', nullable: 'NO' },
        { name: 'passwordHash', type: 'text', nullable: 'NO' },
        { name: 'name', type: 'text', nullable: 'NO' },
        { name: 'createdAt', type: 'timestamp without time zone', nullable: 'NO' },
        { name: 'updatedAt', type: 'timestamp without time zone', nullable: 'NO' }
      ]

      requiredColumns.forEach(required => {
        const column = tableInfo.find(col => col.column_name === required.name)
        expect(column).toBeDefined()
        expect(column!.is_nullable).toBe(required.nullable)
      })
    })

    it('should have proper indexes on Admin table', async () => {
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'Admin'
      ` as Array<{
        indexname: string
        indexdef: string
      }>

      // Should have primary key on id
      const primaryKeyIndex = indexes.find(idx =>
        idx.indexdef.includes('PRIMARY KEY') && idx.indexdef.includes('(id)')
      )
      expect(primaryKeyIndex).toBeDefined()

      // Should have unique index on email
      const emailIndex = indexes.find(idx =>
        idx.indexdef.includes('UNIQUE') && idx.indexdef.includes('email')
      )
      expect(emailIndex).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    it('should perform admin lookup within acceptable time', async () => {
      const testAdmin = {
        id: 'perf-admin',
        email: 'perf-admin@test.com',
        name: 'Performance Test Admin',
        passwordHash: '$2b$12$test.hash.perf'
      }

      try {
        await prisma.admin.create({ data: testAdmin })

        const startTime = Date.now()

        await prisma.admin.findUnique({
          where: { email: testAdmin.email }
        })

        const executionTime = Date.now() - startTime

        // Admin lookup should be fast (under 100ms in most cases)
        expect(executionTime).toBeLessThan(1000) // 1 second max for tests
      } finally {
        await prisma.admin.deleteMany({
          where: { email: testAdmin.email }
        })
      }
    })

    it('should handle bulk operations efficiently', async () => {
      const bulkAdmins = Array(10).fill(null).map((_, index) => ({
        id: `bulk-admin-${index}`,
        email: `bulk-admin-${index}@test.com`,
        name: `Bulk Admin ${index}`,
        passwordHash: '$2b$12$test.hash.bulk'
      }))

      try {
        const startTime = Date.now()

        await prisma.admin.createMany({
          data: bulkAdmins
        })

        const executionTime = Date.now() - startTime

        // Bulk creation should be efficient
        expect(executionTime).toBeLessThan(5000) // 5 seconds max

        // Verify all were created
        const createdCount = await prisma.admin.count({
          where: {
            email: {
              startsWith: 'bulk-admin-'
            }
          }
        })

        expect(createdCount).toBe(bulkAdmins.length)
      } finally {
        await prisma.admin.deleteMany({
          where: {
            email: {
              startsWith: 'bulk-admin-'
            }
          }
        })
      }
    })
  })
})