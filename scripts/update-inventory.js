const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateInventoryFields() {
  try {
    console.log('Updating existing products with inventory fields...')

    // Get all products first
    const products = await prisma.product.findMany()
    let updateCount = 0

    // Update each product individually
    for (const product of products) {
      if (product.stockQuantity === null || product.stockQuantity === undefined) {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: 10, // Default stock quantity
            lowStockThreshold: 5, // Default low stock threshold
            manufacturingTime: '2-3 weeks' // Default manufacturing time
          }
        })
        updateCount++
      }
    }

    console.log(`Updated ${updateCount} products with inventory fields`)

    // Show updated products
    const updatedProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        lowStockThreshold: true,
        manufacturingTime: true
      }
    })

    console.log('\nCurrent products:')
    updatedProducts.forEach(product => {
      console.log(`- ${product.name}: ${product.stockQuantity} in stock, low threshold: ${product.lowStockThreshold}`)
    })

  } catch (error) {
    console.error('Error updating inventory fields:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateInventoryFields()