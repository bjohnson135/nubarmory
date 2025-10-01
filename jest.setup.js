import { TextEncoder, TextDecoder } from 'util'

// Setup polyfills BEFORE importing any modules
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Define Node for testing-library (BEFORE import)
global.Node = class Node {
  static ELEMENT_NODE = 1
  static TEXT_NODE = 3
}

global.Element = class Element extends Node {}
global.HTMLElement = class HTMLElement extends Element {}

// Mock DOM environment without JSDOM (simpler approach)
global.window = {
  location: {
    href: 'http://localhost:3000'
  }
}
global.document = {
  createElement: () => ({}),
  getElementById: () => null,
  querySelectorAll: () => []
}
global.navigator = {
  userAgent: 'node.js'
}

import '@testing-library/jest-dom'

// Mock Request and Response for Next.js API routes
global.Request = global.Request || class Request {
  constructor(input, init) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Map(Object.entries(init?.headers || {}))
    this.body = init?.body
  }

  async formData() {
    return new FormData()
  }

  async json() {
    return JSON.parse(this.body)
  }
}

global.Response = global.Response || class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Map(Object.entries(init?.headers || {}))
  }

  async json() {
    return JSON.parse(this.body)
  }

  static json(data, init) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    })
  }
}

// Mock NextResponse for API routes
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init) => new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    })
  }
}))

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