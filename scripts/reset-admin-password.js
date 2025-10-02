#!/usr/bin/env node

/**
 * Admin Password Reset Utility
 *
 * Usage: node scripts/reset-admin-password.js [new-password]
 * If no password provided, will use 'admin123' as default
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetAdminPassword(newPassword = 'admin123') {
  try {
    console.log('🔄 Resetting admin password...')

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    console.log('✅ Password hashed successfully')

    // Find and update the admin user
    const admin = await prisma.admin.findFirst({
      where: {
        email: 'admin@nubarmory.com'
      }
    })

    if (!admin) {
      console.log('❌ Admin user not found')
      return
    }

    await prisma.admin.update({
      where: {
        id: admin.id
      },
      data: {
        passwordHash: hashedPassword
      }
    })

    console.log('✅ Admin password reset successfully!')
    console.log(`📧 Email: admin@nubarmory.com`)
    console.log(`🔑 New Password: ${newPassword}`)
    console.log('🔒 Hash:', hashedPassword)

    // Test the new password
    const isValid = await bcrypt.compare(newPassword, hashedPassword)
    console.log('🧪 Password verification test:', isValid ? '✅ PASS' : '❌ FAIL')

  } catch (error) {
    console.error('❌ Error resetting password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get password from command line or use default
const newPassword = process.argv[2] || 'admin123'
resetAdminPassword(newPassword)