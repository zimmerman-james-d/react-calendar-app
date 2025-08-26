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

// Mocks for URL methods used in saving files
Object.defineProperty(self.URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-blob-url'),
});
Object.defineProperty(self.URL, 'revokeObjectURL', {
  value: jest.fn(),
});
