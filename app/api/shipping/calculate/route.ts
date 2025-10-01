import { NextRequest, NextResponse } from 'next/server'

interface ShippingItem {
  productId: string
  quantity: number
  weightOz?: number
  lengthIn?: number
  widthIn?: number
  heightIn?: number
}

interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  zipCode: string
  country: string
}

// Default dimensions for products without specified dimensions (typical 3D printed sword hilt)
const DEFAULT_DIMENSIONS = {
  weightOz: 4,    // 4 ounces - typical weight for a 3D printed sword hilt
  lengthIn: 8,    // 8 inches long
  widthIn: 3,     // 3 inches wide
  heightIn: 3     // 3 inches high
}

// Your business address (ship from location)
const ORIGIN_ADDRESS = {
  name: "NubArmory",
  street1: "123 Workshop St",  // Replace with your actual address
  city: "Your City",           // Replace with your actual city
  state: "YS",                // Replace with your actual state
  zip: "12345",               // Replace with your actual ZIP
  country: "US"
}

export async function POST(request: NextRequest) {
  try {
    const { items, shippingAddress }: {
      items: ShippingItem[]
      shippingAddress: ShippingAddress
    } = await request.json()

    if (!items?.length || !shippingAddress) {
      return NextResponse.json(
        { error: 'Items and shipping address are required' },
        { status: 400 }
      )
    }

    // Try Shippo API first, fall back to manual calculation if it fails
    let carriers
    try {
      carriers = await calculateShippingWithShippo(items, shippingAddress)
    } catch (error) {
      console.log('Shippo API failed, using fallback calculation:', error)
      const fallbackCosts = await calculateShippingCost(items, shippingAddress)
      carriers = [
        {
          service: 'USPS Priority Mail',
          cost: fallbackCosts.usps,
          estimatedDays: '2-3'
        },
        {
          service: 'UPS Ground',
          cost: fallbackCosts.ups,
          estimatedDays: '3-5'
        },
        {
          service: 'FedEx Ground',
          cost: fallbackCosts.fedex,
          estimatedDays: '3-5'
        }
      ]
    }

    return NextResponse.json({
      success: true,
      carriers
    })

  } catch (error) {
    console.error('Shipping calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate shipping' },
      { status: 500 }
    )
  }
}

async function calculateShippingCost(items: ShippingItem[], shippingAddress: ShippingAddress) {
  // Calculate total weight and dimensions
  let totalWeight = 0
  let maxLength = 0
  let maxWidth = 0
  let totalHeight = 0

  items.forEach(item => {
    const weight = item.weightOz || DEFAULT_DIMENSIONS.weightOz
    const length = item.lengthIn || DEFAULT_DIMENSIONS.lengthIn
    const width = item.widthIn || DEFAULT_DIMENSIONS.widthIn
    const height = item.heightIn || DEFAULT_DIMENSIONS.heightIn

    totalWeight += weight * item.quantity
    maxLength = Math.max(maxLength, length)
    maxWidth = Math.max(maxWidth, width)
    totalHeight += height * item.quantity
  })

  // Calculate distance-based shipping rates
  const isInternational = shippingAddress.country !== 'US'
  const baseRate = isInternational ? 25.00 : 8.00

  // Weight-based pricing (per ounce over 8oz)
  const weightSurcharge = Math.max(0, totalWeight - 8) * 0.50

  // Size-based pricing (large packages)
  const sizeSurcharge = (maxLength > 12 || maxWidth > 6 || totalHeight > 6) ? 3.00 : 0

  const uspsBase = baseRate + weightSurcharge + sizeSurcharge
  const upsBase = uspsBase * 1.3  // UPS typically 30% more expensive
  const fedexBase = uspsBase * 1.4 // FedEx typically 40% more expensive

  return {
    usps: Math.round(uspsBase * 100) / 100,
    ups: Math.round(upsBase * 100) / 100,
    fedex: Math.round(fedexBase * 100) / 100
  }
}

// Function to integrate with Shippo API
async function calculateShippingWithShippo(items: ShippingItem[], shippingAddress: ShippingAddress) {
  const shippoToken = process.env.SHIPPO_API_TOKEN

  if (!shippoToken || shippoToken.includes('your_api_token_here')) {
    throw new Error('Shippo API token not configured')
  }

  // Calculate total dimensions
  let totalWeight = 0
  let maxLength = 0
  let maxWidth = 0
  let totalHeight = 0

  items.forEach(item => {
    const weight = item.weightOz || DEFAULT_DIMENSIONS.weightOz
    const length = item.lengthIn || DEFAULT_DIMENSIONS.lengthIn
    const width = item.widthIn || DEFAULT_DIMENSIONS.widthIn
    const height = item.heightIn || DEFAULT_DIMENSIONS.heightIn

    totalWeight += weight * item.quantity
    maxLength = Math.max(maxLength, length)
    maxWidth = Math.max(maxWidth, width)
    totalHeight += height * item.quantity
  })

  // Create shipment request
  const shipmentData = {
    address_from: {
      name: process.env.ORIGIN_ADDRESS_NAME || "NubArmory",
      street1: process.env.ORIGIN_ADDRESS_STREET1 || "1120 Samantha Drive",
      city: process.env.ORIGIN_ADDRESS_CITY || "Paso Robles",
      state: process.env.ORIGIN_ADDRESS_STATE || "CA",
      zip: process.env.ORIGIN_ADDRESS_ZIP || "93446",
      country: "US"
    },
    address_to: {
      name: "Customer",
      street1: shippingAddress.line1,
      street2: shippingAddress.line2 || "",
      city: shippingAddress.city,
      state: shippingAddress.state,
      zip: shippingAddress.zipCode,
      country: shippingAddress.country
    },
    parcels: [{
      length: maxLength.toString(),
      width: maxWidth.toString(),
      height: Math.max(totalHeight, 1).toString(), // Minimum 1 inch height
      distance_unit: "in",
      weight: totalWeight.toString(),
      mass_unit: "oz"
    }]
  }

  // Call Shippo API
  const response = await fetch('https://api.goshippo.com/shipments/', {
    method: 'POST',
    headers: {
      'Authorization': `ShippoToken ${shippoToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shipmentData)
  })

  if (!response.ok) {
    throw new Error(`Shippo API error: ${response.status}`)
  }

  const shipment = await response.json()

  if (!shipment.rates || shipment.rates.length === 0) {
    throw new Error('No shipping rates returned from Shippo')
  }

  // Filter and format the rates
  return shipment.rates
    .filter((rate: any) => rate.amount && rate.amount !== "0.00")
    .map((rate: any) => ({
      service: `${rate.provider} ${rate.servicelevel.name}`,
      cost: parseFloat(rate.amount),
      carrier: rate.provider,
      estimatedDays: rate.estimated_days || 'Unknown'
    }))
    .slice(0, 5) // Limit to top 5 options
}