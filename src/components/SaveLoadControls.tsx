import React, { useRef, useState } from 'react';
import { EventDefinition } from '../types';
import CryptoJS from 'crypto-js';
import { EncryptionModal } from './EncryptionModal';

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

const createFileName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};


const DEBUG_PASSWORD = "debug123"; // Secret debug password

export function SaveLoadControls({ eventDefinitions, startDate, calendarName, onLoad }: SaveLoadControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadedFileContent, setLoadedFileContent] = useState<string | null>(null);

  const handleDebugSave = (data: SaveData) => {
    const debugData = {
      ...data,
    };
    const debugDataStr = JSON.stringify(debugData, null, 2);
    console.log("Debug Save Data (unencrypted):", debugDataStr);

    // Optionally, offer to download the debug JSON
    const dataBlob = new Blob([debugDataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-${createFileName(data.calendarName || 'calendar-schedule')}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert("Debug save complete. Check console for JSON output and a downloaded file.");
    setIsSaveModalOpen(false);
  };

  const handleDebugLoad = (content: string) => {
    console.log("Debug Load Data (raw file content):", content);
    alert("Debug load complete. Raw file content logged to console.");
    setIsLoadModalOpen(false);
    setLoadedFileContent(null);
  };

  const handleSave = (password: string) => {
    if (password === DEBUG_PASSWORD) {
      handleDebugSave({
        calendarName,
        startDate,
        eventDefinitions,
      });
      return;
    }

    if (eventDefinitions.length === 0 && !startDate && !calendarName) {
      alert("There is nothing to save.");
      return;
    }

    const dataToSave: SaveData = {
      calendarName,
      startDate,
      eventDefinitions,
    };

    const dataStr = JSON.stringify(dataToSave);
    const encryptedData = CryptoJS.AES.encrypt(dataStr, password).toString();

    const dataBlob = new Blob([encryptedData], { type: "text/plain" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;

    const fileName = createFileName(calendarName || 'calendar-schedule');
    link.download = `${fileName}.tclx`;

    link.click();
    URL.revokeObjectURL(url);
    setIsSaveModalOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setLoadedFileContent(text);
        setIsLoadModalOpen(true);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDecryptAndLoad = (password: string) => {
    if (!loadedFileContent) return;

    try {
      const decryptedBytes = CryptoJS.AES.decrypt(loadedFileContent, password);
      const decryptedDataStr = decryptedBytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedDataStr) {
        throw new Error("Decryption failed. Check your password.");
      }

      const loadedData = JSON.parse(decryptedDataStr) as SaveData;
      if (typeof loadedData.calendarName === 'string' && typeof loadedData.startDate === 'string' && Array.isArray(loadedData.eventDefinitions)) {
        onLoad(loadedData);
      } else {
        alert("Invalid file format after decryption.");
      }
    } catch (error) {
      alert("Error decrypting file. Please check your password and file integrity.");
      console.error("Decryption error:", error);
    } finally {
      setIsLoadModalOpen(false);
      setLoadedFileContent(null);
    }
  };

  return (
    <>
      <div className="save-load-controls">
        <button onClick={() => setIsSaveModalOpen(true)} className="save-button">Save Calendar</button>
        <button onClick={() => fileInputRef.current?.click()} className="load-button">Load Calendar</button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept=".tclx"
          data-testid="load-file-input"
        />
      </div>

      <EncryptionModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSubmit={handleSave}
        promptText="Enter a password to encrypt your schedule:"
      />

      <EncryptionModal
        isOpen={isLoadModalOpen}
        onClose={() => {
          setIsLoadModalOpen(false);
          setLoadedFileContent(null);
        }}
        onSubmit={handleDecryptAndLoad}
        promptText="Enter the password to decrypt your schedule:"
      />
    </>
  );
}
