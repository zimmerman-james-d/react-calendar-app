import '@testing-library/jest-dom';

// Declared narrowly rather than pulling in @types/node just for this (see
// the similar `declare const process` in SaveLoadControls.tsx). Jest's
// jsdom sandbox doesn't inherit Node's global TextEncoder/TextDecoder, and
// jsdom itself doesn't provide them either (unlike real browsers), so pull
// them from Node modules directly.
declare function require(id: string): any;
const { TextEncoder, TextDecoder } = require('util');
Object.defineProperty(self, 'TextEncoder', { value: TextEncoder });
Object.defineProperty(self, 'TextDecoder', { value: TextDecoder });

// Mock for crypto.randomUUID / crypto.getRandomValues (the latter is what
// CryptoJS.AES.encrypt needs to generate its salt).
const nodeCrypto = require('crypto');
Object.defineProperty(self, 'crypto', {
  value: {
    randomUUID: () => `uuid-${Math.random().toString(36).substring(2, 15)}`,
    getRandomValues: (arr: Uint8Array) => nodeCrypto.randomFillSync(arr),
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
