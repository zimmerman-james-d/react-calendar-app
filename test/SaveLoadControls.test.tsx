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
// - handleFileChange: Ensure file input is cleared after selection.
// - Test file input accept attribute.]
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

  it('should alert if there is nothing to save', () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderControls({ eventDefinitions: [], startDate: '', calendarName: '' });
    fireEvent.click(screen.getByText('Save Calendar'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(alertMock).toHaveBeenCalledWith("There is nothing to save.");
    expect(CryptoJS.AES.encrypt).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it('should alert for invalid file format after decryption', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderControls();

    // Mock JSON.parse to return an invalid structure
    jest.spyOn(JSON, 'parse').mockReturnValueOnce({ invalid: 'format' });

    const encryptedContent = `encrypted:{"some":"invalid json"}:password123`;
    const file = new File([encryptedContent], 'invalid.tclx', { type: 'text/plain' });

    const input = screen.getByTestId('load-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByTestId('encryption-modal');
    fireEvent.click(screen.getByText('Confirm'));

    expect(alertMock).toHaveBeenCalledWith("Invalid file format after decryption.");
    expect(mockOnLoad).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it('should alert for decryption failure', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderControls();

    // Mock CryptoJS.AES.decrypt to return an empty string (simulating decryption failure)
    (CryptoJS.AES.decrypt as jest.Mock).mockReturnValueOnce({
      toString: () => '',
    });

    const encryptedContent = `encrypted:bad-data:wrong-password`;
    const file = new File([encryptedContent], 'bad.tclx', { type: 'text/plain' });

    const input = screen.getByTestId('load-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByTestId('encryption-modal');
    fireEvent.click(screen.getByText('Confirm'));

    expect(alertMock).toHaveBeenCalledWith("Error decrypting file. Please check your password and file integrity.");
    expect(mockOnLoad).not.toHaveBeenCalled();
    alertMock.mockRestore();
  });

  it('should clear the file input after selection', async () => {
    renderControls();
    const file = new File(['test content'], 'test.tclx', { type: 'text/plain' });
    const input = screen.getByTestId('load-file-input') as HTMLInputElement;

    // Mock the input's value setter
    const originalSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    const setterSpy = jest.fn();
    Object.defineProperty(input, 'value', {
      set: setterSpy,
    });

    fireEvent.change(input, { target: { files: [file] } });

    // Expect the setter to have been called with an empty string
    expect(setterSpy).toHaveBeenCalledWith('');

    // Restore the original setter
    if (originalSetter) {
      Object.defineProperty(input, 'value', { set: originalSetter });
    }
  });

  it('should have the correct accept attribute for file input', () => {
    renderControls();
    const input = screen.getByTestId('load-file-input');
    expect(input).toHaveAttribute('accept', '.tclx');
  });
});
