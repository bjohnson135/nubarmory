import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'
)

export interface AdminUser {
  id: string
  email: string
  name: string
}

export async function verifyTokenEdge(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AdminUser
  } catch (error) {
    console.log('Token verification failed in edge:', error)
    return null
  }
}