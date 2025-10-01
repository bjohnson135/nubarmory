import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useParams() {
    return {
      id: 'test-product-id'
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/test-path'
  }
}))

// Mock fetch globally
global.fetch = jest.fn()

// Setup console mocks
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}