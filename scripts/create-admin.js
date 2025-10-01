const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: 'admin@nubarmory.com' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists!')
      return
    }

    // Create admin user with default credentials
    const hashedPassword = await bcrypt.hash('admin123', 12)

    const admin = await prisma.admin.create({
      data: {
        email: 'admin@nubarmory.com',
        passwordHash: hashedPassword,
        name: 'NubArmory Admin'
      }
    })

    console.log('Admin user created successfully!')
    console.log('Email:', admin.email)
    console.log('Password: admin123')
    console.log('\nYou can now login at /admin/login')

  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()