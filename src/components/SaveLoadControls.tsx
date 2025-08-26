import React, { useRef } from 'react';
import { EventDefinition } from '../types';

// Define the structure for the saved file
interface SaveData {
  calendarName: string;
  startDate: string;
  eventDefinitions: EventDefinition[];
}

interface SaveLoadControlsProps {
  eventDefinitions: EventDefinition[];
  startDate: string;
  calendarName: string;
  onLoad: (data: SaveData) => void;
}

// Helper function to create a filesystem-friendly name
const createFileName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, ''); // Remove all non-alphanumeric characters except hyphens
};

export function SaveLoadControls({ eventDefinitions, startDate, calendarName, onLoad }: SaveLoadControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (eventDefinitions.length === 0 && !startDate && !calendarName) {
      alert("There is nothing to save.");
      return;
    }
    
    const dataToSave: SaveData = {
      calendarName,
      startDate,
      eventDefinitions,
    };

    const dataStr = JSON.stringify(dataToSave, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Use the helper function to format the filename
    const fileName = createFileName(calendarName || 'calendar-schedule');
    link.download = `${fileName}.json`;

    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const loadedData = JSON.parse(text) as SaveData;
          // Validate the structure of the loaded file
          if (typeof loadedData.calendarName === 'string' && typeof loadedData.startDate === 'string' && Array.isArray(loadedData.eventDefinitions)) {
            onLoad(loadedData);
          } else {
            alert("Invalid file format. The file must contain a calendarName, startDate, and eventDefinitions.");
          }
        }
      } catch (error) {
        alert("Error reading or parsing the file.");
        console.error("File load error:", error);
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="save-load-controls">
      <button onClick={handleSave} className="save-button">Save Calendar</button>
      <button onClick={handleLoadClick} className="load-button">Load Calendar</button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".json"
      />
    </div>
  );
}
