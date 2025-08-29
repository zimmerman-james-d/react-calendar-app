import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaveLoadControls } from '../src/components/SaveLoadControls';
import { EventDefinition } from '../src/types';
import CryptoJS from 'crypto-js';

// Mock the EncryptionModal component
jest.mock('../src/components/EncryptionModal', () => ({
  EncryptionModal: ({ isOpen, onSubmit, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="encryption-modal">
        <button onClick={() => onSubmit('password123')}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

// Mock the crypto-js library
jest.mock('crypto-js', () => ({
  AES: {
    encrypt: jest.fn((data, password) => ({
      toString: () => `encrypted:${data}:${password}`,
    })),
    decrypt: jest.fn((encryptedData, password) => ({
      toString: (encoding: any) => {
        if (password !== 'password123' || !encryptedData.startsWith('encrypted:')) {
          return ''; // Simulate wrong password or bad data
        }
        return encryptedData.replace(`encrypted:`, '').replace(`:${password}`, '');
      },
    })),
  },
  enc: {
    Utf8: {},
  },
}));

// TODO: Add tests for SaveLoadControls.tsx:
// - handleSave: Test scenario where nothing is saved (lines 34-35).
// - handleDecryptAndLoad: Test invalid file format after decryption (line 86).
// - handleDecryptAndLoad: Test decryption error (lines 93-97).
// - handleFileChange: Ensure file input is cleared after selection (line 70).
// - Test file input accept attribute.
describe('SaveLoadControls Component with Encryption', () => {
  const mockOnLoad = jest.fn();
  const mockEventDefinitions: EventDefinition[] = [
    { id: 'def-1', title: 'Encrypted Event', date: '2025-12-25' },
  ];
  const mockStartDate = '2025-12-01';
  const mockCalendarName = 'My Secret Calendar';

  const renderControls = (props = {}) => {
    const defaultProps = {
      onLoad: mockOnLoad,
      eventDefinitions: mockEventDefinitions,
      startDate: mockStartDate,
      calendarName: mockCalendarName,
    };
    return render(<SaveLoadControls {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should open the save modal and encrypt the data on save', () => {
    renderControls();
    
    // Spy on the anchor element's click method to prevent the navigation error
    const linkClickMock = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    fireEvent.click(screen.getByText('Save Calendar'));
    expect(screen.getByTestId('encryption-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm'));

    const expectedSaveData = JSON.stringify({
      calendarName: mockCalendarName,
      startDate: mockStartDate,
      eventDefinitions: mockEventDefinitions,
    });
    
    expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith(expectedSaveData, 'password123');
    // Verify that the download was triggered
    expect(linkClickMock).toHaveBeenCalled();

    // Clean up the spy
    linkClickMock.mockRestore();
  });

  it('should open the load modal and decrypt the data on load', async () => {
    renderControls();

    const encryptedContent = `encrypted:${JSON.stringify({
        calendarName: 'Loaded Calendar',
        startDate: '2026-01-01',
        eventDefinitions: [{ id: 'loaded-1', title: 'Loaded Event', date: '2026-01-05' }],
    })}:password123`;
    
    const file = new File([encryptedContent], 'schedule.tclx', { type: 'text/plain' });

    const input = screen.getByTestId('load-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByTestId('encryption-modal');

    fireEvent.click(screen.getByText('Confirm'));

    expect(CryptoJS.AES.decrypt).toHaveBeenCalledWith(encryptedContent, 'password123');
    expect(mockOnLoad).toHaveBeenCalledWith({
      calendarName: 'Loaded Calendar',
      startDate: '2026-01-01',
      eventDefinitions: [{ id: 'loaded-1', title: 'Loaded Event', date: '2026-01-05' }],
    });
  });
});
