// Jest setup for Node environment tests (API, integration)
// Does not include @testing-library/jest-dom to avoid DOM dependencies

// Mock Next.js router for Node environment
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

// Mock fetch globally for Node environment
global.fetch = jest.fn()

// Setup console mocks
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}