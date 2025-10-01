import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { CartProvider, useCart } from '@/components/CartContext'
import { Product } from '@/types'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Test component to access cart context
const TestComponent = () => {
  const { items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice } = useCart()

  return (
    <div>
      <div data-testid="total-items">{totalItems}</div>
      <div data-testid="total-price">{totalPrice.toFixed(2)}</div>
      <div data-testid="items-count">{items.length}</div>
      {items.map((item) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          <span data-testid={`product-name-${item.id}`}>{item.product.name}</span>
          <span data-testid={`quantity-${item.id}`}>{item.quantity}</span>
          <span data-testid={`price-${item.id}`}>{item.product.price}</span>
          {item.customization && (
            <div data-testid={`customization-${item.id}`}>
              {JSON.stringify(item.customization)}
            </div>
          )}
        </div>
      ))}
      <button onClick={() => addItem(mockProduct1, 1, { engraving: 'Test 1', colors: ['Red'] })}>
        Add Product 1 Red
      </button>
      <button onClick={() => addItem(mockProduct1, 1, { engraving: 'Test 2', colors: ['Blue'] })}>
        Add Product 1 Blue
      </button>
      <button onClick={() => addItem(mockProduct2, 2)}>
        Add Product 2
      </button>
      {items.length > 0 && (
        <>
          <button onClick={() => removeItem(items[0].id)}>Remove First Item</button>
          <button onClick={() => updateQuantity(items[0].id, 5)}>Update First Item Quantity</button>
        </>
      )}
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  )
}

const mockProduct1: Product = {
  id: 'product-1',
  name: 'Sword Hilt',
  description: 'A premium sword hilt',
  price: 89.99,
  images: ['/images/sword1.jpg'],
  category: 'premium',
  material: 'PLA+',
  finish: 'Standard',
  inStock: true,
  customizable: true,
  features: ['Engraving', 'Multi-color']
}

const mockProduct2: Product = {
  id: 'product-2',
  name: 'Cigar Stand',
  description: 'A basic cigar stand',
  price: 25.00,
  images: ['/images/stand1.jpg'],
  category: 'standard',
  material: 'PLA',
  finish: 'Standard',
  inStock: true,
  customizable: false,
  features: []
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  it('should initialize with empty cart', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    expect(screen.getByTestId('total-items')).toHaveTextContent('0')
    expect(screen.getByTestId('total-price')).toHaveTextContent('0.00')
    expect(screen.getByTestId('items-count')).toHaveTextContent('0')
  })

  it('should add items with different customizations as separate entries', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add same product with different customizations
    act(() => {
      screen.getByText('Add Product 1 Red').click()
    })

    act(() => {
      screen.getByText('Add Product 1 Blue').click()
    })

    // Should have 2 separate items
    expect(screen.getByTestId('items-count')).toHaveTextContent('2')
    expect(screen.getByTestId('total-items')).toHaveTextContent('2')
    expect(screen.getByTestId('total-price')).toHaveTextContent('179.98')

    // Check that both items have different customizations
    const items = screen.getAllByTestId(/^item-/)
    expect(items).toHaveLength(2)

    // Verify customizations are different
    const customizations = screen.getAllByTestId(/^customization-/)
    expect(customizations).toHaveLength(2)
    expect(customizations[0]).toHaveTextContent('engraving":"Test 1"')
    expect(customizations[0]).toHaveTextContent('colors":["Red"]')
    expect(customizations[1]).toHaveTextContent('engraving":"Test 2"')
    expect(customizations[1]).toHaveTextContent('colors":["Blue"]')
  })

  it('should combine identical products with same customizations', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add same product with same customization twice
    act(() => {
      screen.getByText('Add Product 1 Red').click()
    })

    act(() => {
      screen.getByText('Add Product 1 Red').click()
    })

    // Should have 1 item with quantity 2
    expect(screen.getByTestId('items-count')).toHaveTextContent('1')
    expect(screen.getByTestId('total-items')).toHaveTextContent('2')
    expect(screen.getByTestId('total-price')).toHaveTextContent('179.98')

    const quantityElement = screen.getByTestId(/^quantity-/)
    expect(quantityElement).toHaveTextContent('2')
  })

  it('should generate unique IDs for cart items', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    act(() => {
      screen.getByText('Add Product 1 Red').click()
    })

    act(() => {
      screen.getByText('Add Product 1 Blue').click()
    })

    const items = screen.getAllByTestId(/^item-/)
    expect(items).toHaveLength(2)

    // Check that items have different IDs
    const item1 = items[0]
    const item2 = items[1]
    const item1Id = item1.getAttribute('data-testid')?.replace('item-', '')
    const item2Id = item2.getAttribute('data-testid')?.replace('item-', '')

    expect(item1Id).toBeDefined()
    expect(item2Id).toBeDefined()
    expect(item1Id).not.toBe(item2Id)
    expect(item1Id).toMatch(/^cart-item-\d+-[a-z0-9]+$/)
    expect(item2Id).toMatch(/^cart-item-\d+-[a-z0-9]+$/)
  })

  it('should remove items by unique ID', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add two different items
    act(() => {
      screen.getByText('Add Product 1 Red').click()
    })

    act(() => {
      screen.getByText('Add Product 1 Blue').click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('2')

    // Remove first item
    act(() => {
      screen.getByText('Remove First Item').click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('1')
    expect(screen.getByTestId('total-items')).toHaveTextContent('1')
  })

  it('should update quantity by unique ID', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    act(() => {
      screen.getByText('Add Product 1 Red').click()
    })

    expect(screen.getByTestId('total-items')).toHaveTextContent('1')

    // Update quantity
    act(() => {
      screen.getByText('Update First Item Quantity').click()
    })

    expect(screen.getByTestId('total-items')).toHaveTextContent('5')
    const quantityElement = screen.getByTestId(/^quantity-/)
    expect(quantityElement).toHaveTextContent('5')
  })

  it('should clear all items', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add multiple items
    act(() => {
      screen.getByText('Add Product 1 Red').click()
    })

    act(() => {
      screen.getByText('Add Product 2').click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('2')

    // Clear cart
    act(() => {
      screen.getByText('Clear Cart').click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('0')
    expect(screen.getByTestId('total-items')).toHaveTextContent('0')
    expect(screen.getByTestId('total-price')).toHaveTextContent('0.00')
  })

  it('should persist cart to localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    act(() => {
      screen.getByText('Add Product 1 Red').click()
    })

    // Check that localStorage.setItem was called
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cart',
      expect.stringContaining('"name":"Sword Hilt"')
    )
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cart',
      expect.stringContaining('"engraving":"Test 1"')
    )
  })

  it('should load cart from localStorage with backward compatibility', () => {
    // Mock localStorage with cart data without IDs (backward compatibility)
    const savedCartData = JSON.stringify([
      {
        product: mockProduct1,
        quantity: 2,
        customization: { engraving: 'Old Item', colors: ['Green'] }
      }
    ])
    localStorageMock.getItem.mockReturnValue(savedCartData)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Should load the item and generate an ID
    expect(screen.getByTestId('items-count')).toHaveTextContent('1')
    expect(screen.getByTestId('total-items')).toHaveTextContent('2')

    const items = screen.getAllByTestId(/^item-/)
    expect(items).toHaveLength(1)

    // Check that ID was generated
    const itemId = items[0].getAttribute('data-testid')?.replace('item-', '')
    expect(itemId).toMatch(/^cart-item-\d+-\d+$/) // Backward compatibility ID format
  })

  it('should sanitize corrupted localStorage data', () => {
    // Mock localStorage with corrupted data
    localStorageMock.getItem.mockReturnValue('invalid json')

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Should start with empty cart and clear localStorage
    expect(screen.getByTestId('items-count')).toHaveTextContent('0')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cart')
  })

  it('should handle items without customization', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    act(() => {
      screen.getByText('Add Product 2').click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('1')
    expect(screen.getByTestId('total-items')).toHaveTextContent('2')
    expect(screen.getByTestId('total-price')).toHaveTextContent('50.00')

    // Should not have customization element
    expect(screen.queryByTestId(/^customization-/)).not.toBeInTheDocument()
  })

  it('should calculate totals correctly', () => {
    localStorageMock.getItem.mockReturnValue(null)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add different products with different quantities
    act(() => {
      screen.getByText('Add Product 1 Red').click() // $89.99 x 1
    })

    act(() => {
      screen.getByText('Add Product 2').click() // $25.00 x 2
    })

    expect(screen.getByTestId('total-items')).toHaveTextContent('3') // 1 + 2
    expect(screen.getByTestId('total-price')).toHaveTextContent('139.99') // 89.99 + 50.00
  })

  it('should remove item when quantity updated to 0', () => {
    localStorageMock.getItem.mockReturnValue(null)

    const TestComponentWithZeroUpdate = () => {
      const { items, addItem, updateQuantity } = useCart()

      return (
        <div>
          <div data-testid="items-count">{items.length}</div>
          <button onClick={() => addItem(mockProduct1, 1, { engraving: 'Test' })}>
            Add Item
          </button>
          {items.length > 0 && (
            <button onClick={() => updateQuantity(items[0].id, 0)}>
              Update to Zero
            </button>
          )}
        </div>
      )
    }

    render(
      <CartProvider>
        <TestComponentWithZeroUpdate />
      </CartProvider>
    )

    act(() => {
      screen.getByText('Add Item').click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('1')

    act(() => {
      screen.getByText('Update to Zero').click()
    })

    expect(screen.getByTestId('items-count')).toHaveTextContent('0')
  })
})