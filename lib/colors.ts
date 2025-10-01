// Material-specific color configurations for 3D printing

export interface Color {
  name: string
  hex: string
  available: boolean
}

export interface MaterialColors {
  [material: string]: Color[]
}

// Master list of available colors by material type
export const materialColors: MaterialColors = {
  PLA: [
    { name: 'Black', hex: '#000000', available: true },
    { name: 'White', hex: '#FFFFFF', available: true },
    { name: 'Red', hex: '#DC143C', available: true },
    { name: 'Blue', hex: '#0066CC', available: true },
    { name: 'Green', hex: '#228B22', available: true },
    { name: 'Yellow', hex: '#FFD700', available: true },
    { name: 'Orange', hex: '#FF6600', available: true },
    { name: 'Purple', hex: '#800080', available: true },
    { name: 'Pink', hex: '#FF69B4', available: true },
    { name: 'Gray', hex: '#808080', available: true },
    { name: 'Brown', hex: '#8B4513', available: true },
    { name: 'Gold', hex: '#DAA520', available: true },
    { name: 'Silver', hex: '#C0C0C0', available: true },
    { name: 'Glow in Dark', hex: '#90EE90', available: true },
    { name: 'Wood Fill', hex: '#8B4513', available: true }
  ],
  ABS: [
    { name: 'Black', hex: '#000000', available: true },
    { name: 'White', hex: '#FFFFFF', available: true },
    { name: 'Red', hex: '#DC143C', available: true },
    { name: 'Blue', hex: '#0066CC', available: true },
    { name: 'Green', hex: '#228B22', available: true },
    { name: 'Yellow', hex: '#FFD700', available: true },
    { name: 'Orange', hex: '#FF6600', available: true },
    { name: 'Gray', hex: '#808080', available: true },
    { name: 'Natural', hex: '#F5F5DC', available: true }
  ],
  PETG: [
    { name: 'Clear', hex: '#F0F0F0', available: true },
    { name: 'Black', hex: '#000000', available: true },
    { name: 'White', hex: '#FFFFFF', available: true },
    { name: 'Red', hex: '#DC143C', available: true },
    { name: 'Blue', hex: '#0066CC', available: true },
    { name: 'Green', hex: '#228B22', available: true },
    { name: 'Orange', hex: '#FF6600', available: true },
    { name: 'Yellow', hex: '#FFD700', available: true }
  ],
  TPU: [
    { name: 'Black', hex: '#000000', available: true },
    { name: 'White', hex: '#FFFFFF', available: true },
    { name: 'Red', hex: '#DC143C', available: true },
    { name: 'Blue', hex: '#0066CC', available: true },
    { name: 'Clear', hex: '#F0F0F0', available: true },
    { name: 'Yellow', hex: '#FFD700', available: true }
  ],
  Nylon: [
    { name: 'Natural', hex: '#F5F5DC', available: true },
    { name: 'Black', hex: '#000000', available: true },
    { name: 'White', hex: '#FFFFFF', available: true },
    { name: 'Carbon Fiber', hex: '#2F4F4F', available: true }
  ],
  Resin: [
    { name: 'Clear', hex: '#F0F0F0', available: true },
    { name: 'Gray', hex: '#808080', available: true },
    { name: 'Black', hex: '#000000', available: true },
    { name: 'White', hex: '#FFFFFF', available: true },
    { name: 'Red', hex: '#DC143C', available: true },
    { name: 'Blue', hex: '#0066CC', available: true },
    { name: 'Green', hex: '#228B22', available: true },
    { name: 'Yellow', hex: '#FFD700', available: true },
    { name: 'Castable', hex: '#4B0082', available: true },
    { name: 'Flexible', hex: '#708090', available: true },
    { name: 'Tough', hex: '#2F4F4F', available: true },
    { name: 'Water Washable', hex: '#87CEEB', available: true }
  ],
  'Metal Filled': [
    { name: 'Bronze', hex: '#CD7F32', available: true },
    { name: 'Copper', hex: '#B87333', available: true },
    { name: 'Iron', hex: '#434B4D', available: true },
    { name: 'Aluminum', hex: '#848789', available: true },
    { name: 'Stainless Steel', hex: '#71797E', available: true }
  ]
}

// Function to get colors for a specific material
export function getColorsForMaterial(material: string): Color[] {
  return materialColors[material] || materialColors['PLA'] // Default to PLA colors
}

// Function to validate if colors are available for a material
export function validateColors(material: string, selectedColors: string[]): boolean {
  const availableColors = getColorsForMaterial(material)
  const availableColorNames = availableColors
    .filter(c => c.available)
    .map(c => c.name)

  return selectedColors.every(color => availableColorNames.includes(color))
}

// Function to format color selection for display
export function formatColorSelection(colors: string[]): string {
  if (colors.length === 0) return 'No color selected'
  if (colors.length === 1) return colors[0]
  if (colors.length === 2) return `${colors[0]} & ${colors[1]}`
  return `${colors.slice(0, -1).join(', ')} & ${colors[colors.length - 1]}`
}

// Default materials list
export const availableMaterials = [
  'PLA',
  'ABS',
  'PETG',
  'TPU',
  'Nylon',
  'Resin',
  'Metal Filled'
]