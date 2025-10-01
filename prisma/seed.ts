import { PrismaClient } from '@prisma/client'
import bcryptjs from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create Admin User
  const passwordHash = await bcryptjs.hash('admin123', 12)
  await prisma.admin.upsert({
    where: { email: 'admin@nubarmory.com' },
    update: {},
    create: {
      email: 'admin@nubarmory.com',
      passwordHash,
      name: 'Admin User'
    }
  })

  // Create Materials
  const materials = await Promise.all([
    prisma.material.upsert({
      where: { name: 'PLA' },
      update: {},
      create: {
        name: 'PLA',
        displayName: 'PLA (Standard)',
        description: 'Biodegradable thermoplastic, perfect for detailed prints',
        sortOrder: 1,
      }
    }),
    prisma.material.upsert({
      where: { name: 'ABS' },
      update: {},
      create: {
        name: 'ABS',
        displayName: 'ABS (Durable)',
        description: 'Strong and durable, ideal for functional parts',
        sortOrder: 2,
      }
    }),
    prisma.material.upsert({
      where: { name: 'PETG' },
      update: {},
      create: {
        name: 'PETG',
        displayName: 'PETG (Clear/Strong)',
        description: 'Chemical resistant with excellent clarity',
        sortOrder: 3,
      }
    }),
    prisma.material.upsert({
      where: { name: 'TPU' },
      update: {},
      create: {
        name: 'TPU',
        displayName: 'TPU (Flexible)',
        description: 'Flexible rubber-like material',
        sortOrder: 4,
      }
    }),
    prisma.material.upsert({
      where: { name: 'Nylon' },
      update: {},
      create: {
        name: 'Nylon',
        displayName: 'Nylon (Professional)',
        description: 'Strong, flexible, and wear-resistant',
        sortOrder: 5,
      }
    }),
    prisma.material.upsert({
      where: { name: 'Resin' },
      update: {},
      create: {
        name: 'Resin',
        displayName: 'Resin (High Detail)',
        description: 'Ultra-high detail for miniatures and jewelry',
        sortOrder: 6,
      }
    }),
    prisma.material.upsert({
      where: { name: 'Metal_Filled' },
      update: {},
      create: {
        name: 'Metal_Filled',
        displayName: 'Metal Filled (Premium)',
        description: 'PLA infused with metal particles for authentic feel',
        sortOrder: 7,
      }
    })
  ])

  // Create Colors
  const colors = await Promise.all([
    // Standard Colors
    prisma.color.upsert({
      where: { name: 'Black' },
      update: {},
      create: {
        name: 'Black',
        displayName: 'Black',
        hexCode: '#000000',
        sortOrder: 1,
      }
    }),
    prisma.color.upsert({
      where: { name: 'White' },
      update: {},
      create: {
        name: 'White',
        displayName: 'White',
        hexCode: '#FFFFFF',
        sortOrder: 2,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Gray' },
      update: {},
      create: {
        name: 'Gray',
        displayName: 'Gray',
        hexCode: '#808080',
        sortOrder: 3,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Red' },
      update: {},
      create: {
        name: 'Red',
        displayName: 'Red',
        hexCode: '#DC143C',
        sortOrder: 4,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Blue' },
      update: {},
      create: {
        name: 'Blue',
        displayName: 'Blue',
        hexCode: '#0066CC',
        sortOrder: 5,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Green' },
      update: {},
      create: {
        name: 'Green',
        displayName: 'Green',
        hexCode: '#228B22',
        sortOrder: 6,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Yellow' },
      update: {},
      create: {
        name: 'Yellow',
        displayName: 'Yellow',
        hexCode: '#FFD700',
        sortOrder: 7,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Orange' },
      update: {},
      create: {
        name: 'Orange',
        displayName: 'Orange',
        hexCode: '#FF6600',
        sortOrder: 8,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Purple' },
      update: {},
      create: {
        name: 'Purple',
        displayName: 'Purple',
        hexCode: '#800080',
        sortOrder: 9,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Pink' },
      update: {},
      create: {
        name: 'Pink',
        displayName: 'Pink',
        hexCode: '#FF69B4',
        sortOrder: 10,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Brown' },
      update: {},
      create: {
        name: 'Brown',
        displayName: 'Brown',
        hexCode: '#8B4513',
        sortOrder: 11,
      }
    }),
    // Special Colors
    prisma.color.upsert({
      where: { name: 'Clear' },
      update: {},
      create: {
        name: 'Clear',
        displayName: 'Clear/Transparent',
        hexCode: '#F0F0F0',
        sortOrder: 12,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Natural' },
      update: {},
      create: {
        name: 'Natural',
        displayName: 'Natural/Uncolored',
        hexCode: '#F5F5DC',
        sortOrder: 13,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Gold' },
      update: {},
      create: {
        name: 'Gold',
        displayName: 'Gold Metallic',
        hexCode: '#DAA520',
        isSpecial: true,
        sortOrder: 14,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Silver' },
      update: {},
      create: {
        name: 'Silver',
        displayName: 'Silver Metallic',
        hexCode: '#C0C0C0',
        isSpecial: true,
        sortOrder: 15,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Glow_Green' },
      update: {},
      create: {
        name: 'Glow_Green',
        displayName: 'Glow in Dark (Green)',
        hexCode: '#90EE90',
        description: 'Glows green in the dark',
        isSpecial: true,
        sortOrder: 16,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Wood_Fill' },
      update: {},
      create: {
        name: 'Wood_Fill',
        displayName: 'Wood Fill',
        hexCode: '#8B4513',
        description: 'PLA with wood particles',
        isSpecial: true,
        sortOrder: 17,
      }
    }),
    // Metal Colors
    prisma.color.upsert({
      where: { name: 'Bronze' },
      update: {},
      create: {
        name: 'Bronze',
        displayName: 'Bronze',
        hexCode: '#CD7F32',
        isSpecial: true,
        sortOrder: 18,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Copper' },
      update: {},
      create: {
        name: 'Copper',
        displayName: 'Copper',
        hexCode: '#B87333',
        isSpecial: true,
        sortOrder: 19,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Iron' },
      update: {},
      create: {
        name: 'Iron',
        displayName: 'Iron',
        hexCode: '#434B4D',
        isSpecial: true,
        sortOrder: 20,
      }
    }),
    prisma.color.upsert({
      where: { name: 'Carbon_Fiber' },
      update: {},
      create: {
        name: 'Carbon_Fiber',
        displayName: 'Carbon Fiber',
        hexCode: '#2F4F4F',
        description: 'Nylon with carbon fiber',
        isSpecial: true,
        sortOrder: 21,
      }
    })
  ])

  // Create Material-Color associations
  const materialColorMap = {
    'PLA': ['Black', 'White', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Gold', 'Silver', 'Glow_Green', 'Wood_Fill'],
    'ABS': ['Black', 'White', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Natural'],
    'PETG': ['Clear', 'Black', 'White', 'Red', 'Blue', 'Green', 'Orange', 'Yellow'],
    'TPU': ['Black', 'White', 'Red', 'Blue', 'Clear', 'Yellow'],
    'Nylon': ['Natural', 'Black', 'White', 'Carbon_Fiber'],
    'Resin': ['Clear', 'Gray', 'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow'],
    'Metal_Filled': ['Bronze', 'Copper', 'Iron', 'Silver', 'Gold']
  }

  // Create material-color relationships
  for (const [materialName, colorNames] of Object.entries(materialColorMap)) {
    const material = materials.find(m => m.name === materialName)
    if (!material) continue

    for (const colorName of colorNames) {
      const color = colors.find(c => c.name === colorName)
      if (!color) continue

      await prisma.materialColor.upsert({
        where: {
          materialId_colorId: {
            materialId: material.id,
            colorId: color.id
          }
        },
        update: {},
        create: {
          materialId: material.id,
          colorId: color.id,
          isDefault: colorNames.indexOf(colorName) < 3, // First 3 colors are defaults
        }
      })
    }
  }

  // Create sample products with materials and 3D models
  const sampleProducts = [
    {
      name: "Excalibur Elite",
      description: "Legendary sword hilt design with intricate Celtic knotwork and premium gold finish",
      price: 89.99,
      images: ["https://placehold.co/400x400/D4AF37/000000/png?text=Excalibur+Elite"],
      category: "premium",
      finish: "Antique Gold",
      inStock: true,
      customizable: true,
      features: ["Celtic knotwork design", "Ergonomic grip", "Premium gold finish", "Custom engraving available"],
      numberOfColors: 2,
      materialId: materials.find(m => m.name === 'PLA')?.id,
      modelFile: "/models/model-1759253113620.stl",
      availableColors: [],
      colorZones: []
    },
    {
      name: "Viking Berserker",
      description: "Rugged Norse-inspired design with authentic Viking runes and weathered steel finish",
      price: 74.99,
      images: ["https://placehold.co/400x400/71797E/FFFFFF/png?text=Viking+Berserker"],
      category: "standard",
      finish: "Weathered Steel",
      inStock: true,
      customizable: true,
      features: ["Viking rune engravings", "Battle-worn aesthetic", "Textured grip", "Nordic symbolism"],
      numberOfColors: 1,
      materialId: materials.find(m => m.name === 'ABS')?.id,
      modelFile: "/models/model-1759253187727.stl",
      availableColors: [],
      colorZones: []
    },
    {
      name: "Samurai Honor",
      description: "Elegant Japanese katana-inspired tsuka design with traditional wrap pattern",
      price: 79.99,
      images: ["https://placehold.co/400x400/000000/FFFFFF/png?text=Samurai+Honor"],
      category: "standard",
      finish: "Matte Black",
      inStock: true,
      customizable: true,
      features: ["Tsuka wrap pattern", "Japanese aesthetics", "Balanced design", "Minimalist elegance"],
      numberOfColors: 3,
      materialId: materials.find(m => m.name === 'PETG')?.id,
      modelFile: "/models/model-1759254728151.stl",
      availableColors: [],
      colorZones: []
    }
  ]

  // Create products
  for (const productData of sampleProducts) {
    await prisma.product.create({
      data: productData
    })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })