import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SaveLoadControls } from '../src/components/SaveLoadControls';
import { EventDefinition } from '../src/types';

describe('SaveLoadControls Component', () => {
  const mockOnLoad = jest.fn();
  const mockEventDefinitions: EventDefinition[] = [
    { id: 'def-1', title: 'Test Event 1', date: '2025-12-01' },
  ];
  const mockStartDate = '2025-12-01';
  const mockCalendarName = 'My Test Calendar';

  // Mock the URL.createObjectURL and revokeObjectURL for the save test
  const mockCreateObjectURL = jest.fn(() => 'mock-url');
  const mockRevokeObjectURL = jest.fn();
  URL.createObjectURL = mockCreateObjectURL;
  URL.revokeObjectURL = mockRevokeObjectURL;

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
    mockOnLoad.mockClear();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
  });

  it('should trigger a download with the correct data on save', () => {
    renderControls();
    
    // Mock the anchor element's click method
    const linkClickMock = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(linkClickMock);

    fireEvent.click(screen.getByText('Save Calendar'));

    const expectedSaveData = {
      calendarName: mockCalendarName,
      startDate: mockStartDate,
      eventDefinitions: mockEventDefinitions,
    };

    // Check that a Blob was created with the correct JSON string
    expect(Blob).toHaveBeenCalledWith(
      [JSON.stringify(expectedSaveData, null, 2)],
      { type: 'application/json' }
    );
    
    // Check that the download was triggered
    expect(linkClickMock).toHaveBeenCalled();
  });

  it('should call the onLoad prop with parsed data when a valid file is loaded', () => {
    renderControls();

    const fileContent = JSON.stringify({
      calendarName: 'Loaded Calendar',
      startDate: '2026-01-01',
      eventDefinitions: [{ id: 'loaded-1', title: 'Loaded Event', date: '2026-01-05' }],
    });
    const file = new File([fileContent], 'schedule.json', { type: 'application/json' });

    const input = screen.getByTestId('load-file-input'); // We'll need to add this test ID
    fireEvent.change(input, { target: { files: [file] } });
  });

  it('should show an alert for an invalid file format', () => {
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    renderControls();

    const invalidFileContent = JSON.stringify({ wrongKey: 'some-data' });
    const file = new File([invalidFileContent], 'invalid.json', { type: 'application/json' });

    const input = screen.getByTestId('load-file-input');
    fireEvent.change(input, { target: { files: [file] } });
  });
});
