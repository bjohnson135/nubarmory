import { Product } from '@/types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleProducts: Omit<Product, 'id'>[] = [
  {
    name: "Excalibur Elite",
    description: "Legendary sword hilt design with intricate Celtic knotwork and premium gold finish",
    price: 89.99,
    images: ["https://placehold.co/400x400/D4AF37/000000/png?text=Excalibur+Elite"],
    category: "premium",
    material: "Premium PLA+",
    finish: "Antique Gold",
    inStock: true,
    customizable: true,
    features: ["Celtic knotwork design", "Ergonomic grip", "Premium gold finish", "Custom engraving available"]
  },
  {
    name: "Viking Berserker",
    description: "Rugged Norse-inspired design with authentic Viking runes and weathered steel finish",
    price: 74.99,
    images: ["https://placehold.co/400x400/71797E/FFFFFF/png?text=Viking+Berserker"],
    category: "standard",
    material: "High-Strength PLA",
    finish: "Weathered Steel",
    inStock: true,
    customizable: true,
    features: ["Viking rune engravings", "Battle-worn aesthetic", "Textured grip", "Nordic symbolism"]
  },
  {
    name: "Samurai Honor",
    description: "Elegant Japanese katana-inspired tsuka design with traditional wrap pattern",
    price: 79.99,
    images: ["https://placehold.co/400x400/000000/FFFFFF/png?text=Samurai+Honor"],
    category: "standard",
    material: "High-Strength PLA",
    finish: "Matte Black",
    inStock: true,
    customizable: true,
    features: ["Tsuka wrap pattern", "Japanese aesthetics", "Balanced design", "Minimalist elegance"]
  },
  {
    name: "Knight Templar",
    description: "Medieval crusader sword hilt with Templar cross and aged bronze finish",
    price: 84.99,
    images: ["https://placehold.co/400x400/CD7F32/FFFFFF/png?text=Knight+Templar"],
    category: "premium",
    material: "Premium PLA+",
    finish: "Aged Bronze",
    inStock: true,
    customizable: true,
    features: ["Templar cross emblem", "Historical accuracy", "Bronze patina", "Leather wrap option"]
  },
  {
    name: "Pirate Cutlass",
    description: "Swashbuckling design with nautical motifs and antique brass finish",
    price: 69.99,
    images: ["https://placehold.co/400x400/964B00/FFFFFF/png?text=Pirate+Cutlass"],
    category: "standard",
    material: "High-Strength PLA",
    finish: "Antique Brass",
    inStock: true,
    customizable: false,
    features: ["Nautical design elements", "Curved guard", "Brass finish", "Maritime symbols"]
  },
  {
    name: "Dragon Slayer",
    description: "Fantasy-inspired design with dragon scale texture and ruby red accents",
    price: 94.99,
    images: ["https://placehold.co/400x400/8B0000/FFFFFF/png?text=Dragon+Slayer"],
    category: "premium",
    material: "Premium PLA+",
    finish: "Obsidian Black with Red",
    inStock: true,
    customizable: true,
    features: ["Dragon scale texture", "Ruby accents", "Fantasy design", "Custom color options"]
  }
]

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: { category: 'premium' },
      take: 3
    })

    if (products.length === 0) {
      await seedProducts()
      return prisma.product.findMany({
        where: { category: 'premium' },
        take: 3,
        include: {
          material: true
        }
      }) as any
    }

    return products.map(p => ({
      ...p,
      images: p.images as string[],
      features: p.features as string[],
      category: p.category as 'standard' | 'premium' | 'custom'
    })) as any
  } catch (error) {
    return sampleProducts.slice(0, 3) as Product[]
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      include: {
        material: true
      }
    })

    if (products.length === 0) {
      await seedProducts()
      return prisma.product.findMany({
        include: {
          material: true
        }
      }) as any
    }

    return products.map(p => ({
      ...p,
      images: p.images as string[],
      features: p.features as string[],
      category: p.category as 'standard' | 'premium' | 'custom'
    })) as any
  } catch (error) {
    return sampleProducts as Product[]
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        material: true
      }
    })

    if (!product) return null

    return {
      ...product,
      images: product.images as string[],
      features: product.features as string[],
      category: product.category as 'standard' | 'premium' | 'custom'
    } as any
  } catch (error) {
    return null
  }
}

async function seedProducts() {
  try {
    for (const product of sampleProducts) {
      await prisma.product.create({
        data: {
          ...product,
          images: product.images,
          features: product.features
        } as any
      })
    }
  } catch (error) {
    console.error('Error seeding products:', error)
  }
}