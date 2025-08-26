import '@testing-library/jest-dom';

// Mock for crypto.randomUUID
Object.defineProperty(self, 'crypto', {
  value: {
    randomUUID: () => `uuid-${Math.random().toString(36).substring(2, 15)}`,
  },
});

// Mock for Blob
Object.defineProperty(self, 'Blob', {
  value: jest.fn((content, options) => ({
    content,
    options,
  })),
});
