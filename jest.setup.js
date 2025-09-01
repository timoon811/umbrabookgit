import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  
  disconnect() {
    return null;
  }
  
  observe() {
    return null;
  }
  
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  
  disconnect() {
    return null;
  }
  
  observe() {
    return null;
  }
  
  unobserve() {
    return null;
  }
};

// Mock matchMedia (only if window exists)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock fetch API
global.fetch = jest.fn();

// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Console error suppression for known issues
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
