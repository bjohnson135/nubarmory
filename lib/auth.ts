import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'

export interface AdminUser {
  id: string
  email: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function createToken(admin: AdminUser): string {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AdminUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminUser
  } catch {
    return null
  }
}

export async function createAdminUser(email: string, password: string, name: string) {
  const hashedPassword = await hashPassword(password)

  return prisma.admin.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name
    }
  })
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  const admin = await prisma.admin.findUnique({
    where: { email }
  })

  if (!admin || !await verifyPassword(password, admin.passwordHash)) {
    return null
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name
  }
}