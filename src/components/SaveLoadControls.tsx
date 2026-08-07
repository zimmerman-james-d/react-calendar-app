import React, { useRef, useState } from 'react';
import { EventDefinition, SaveData } from '../types';
import CryptoJS from 'crypto-js';

// The plain 'fflate' entry point resolves to fflate's Node build under this
// project's tsup config (platform defaults to node16), which pulls in
// require('worker_threads') support this app never uses and can't run in a
// browser bundle. Import the browser build explicitly instead.
//
// ts-jest's TypeScript module resolution doesn't follow package.json
// "exports" subpaths the way tsup/esbuild does, so it can't resolve this
// specifier on its own (confirmed working at runtime via a production
// build + a real browser). Suppressed for the type checker on this one
// line only; the two functions are re-typed explicitly right below so
// every call site stays fully type-checked.
// @ts-expect-error -- see comment above
import { deflateSync as _deflateSync, inflateSync as _inflateSync } from 'fflate/browser';
const deflateSync: (data: Uint8Array) => Uint8Array = _deflateSync;
const inflateSync: (data: Uint8Array) => Uint8Array = _inflateSync;
import { EncryptionModal } from './EncryptionModal';
import { CopyTextModal } from './CopyTextModal';
import { PasteTextModal } from './PasteTextModal';
import { encodeCompact, decodeCompact } from '../utils/compactSaveFormat';

function wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const { words, sigBytes } = wordArray;
  const bytes = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    bytes[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return bytes;
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


// This is not a secret. The repo is public and the bundle ships to anyone who
// loads the page, so the password alone gates nothing — it only keeps the debug
// path out of the way while developing. The flag below is what disables it on
// the deployed site: tsup fixes NODE_ENV at build time, so this resolves to a
// constant false there and the debug save can never be triggered. The code is
// still present in the bundle, just unreachable.
// Declared narrowly rather than pulling in @types/node just for this: tsup
// substitutes the value at build time, and Jest supplies the real global.
declare const process: { env: { NODE_ENV?: string } };

const DEBUG_PASSWORD = "debug123";
const DEBUG_TOOLS_ENABLED = process.env.NODE_ENV !== 'production';

export function SaveLoadControls({ eventDefinitions, startDate, calendarName, onLoad }: SaveLoadControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadedFileContent, setLoadedFileContent] = useState<string | null>(null);

  const [isCopyPasswordModalOpen, setIsCopyPasswordModalOpen] = useState(false);
  const [isCopyTextModalOpen, setIsCopyTextModalOpen] = useState(false);
  const [copyText, setCopyText] = useState('');

  const [isPasteTextModalOpen, setIsPasteTextModalOpen] = useState(false);
  const [isPastePasswordModalOpen, setIsPastePasswordModalOpen] = useState(false);
  const [pastedContent, setPastedContent] = useState<string | null>(null);

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
    if (DEBUG_TOOLS_ENABLED && password === DEBUG_PASSWORD) {
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

  const handleCopyAsText = (password: string) => {
    if (eventDefinitions.length === 0 && !startDate && !calendarName) {
      alert("There is nothing to save.");
      return;
    }

    const encoded = encodeCompact({ calendarName, startDate, eventDefinitions });
    const compressed = deflateSync(encoded);
    const encrypted = CryptoJS.AES.encrypt(CryptoJS.lib.WordArray.create(compressed), password).toString();

    setCopyText(encrypted);
    setIsCopyPasswordModalOpen(false);
    setIsCopyTextModalOpen(true);
  };

  const handlePasteSubmit = (text: string) => {
    setPastedContent(text);
    setIsPasteTextModalOpen(false);
    setIsPastePasswordModalOpen(true);
  };

  const handleDecryptAndLoadText = (password: string) => {
    if (!pastedContent) return;

    try {
      const decryptedWordArray = CryptoJS.AES.decrypt(pastedContent, password);
      const decompressed = inflateSync(wordArrayToUint8Array(decryptedWordArray));
      const loadedData = decodeCompact(decompressed);

      if (typeof loadedData.calendarName === 'string' && typeof loadedData.startDate === 'string' && Array.isArray(loadedData.eventDefinitions)) {
        onLoad(loadedData);
      } else {
        alert("Invalid text format after decryption.");
      }
    } catch (error) {
      alert("Error decrypting text. Please check your password and that you pasted the full text.");
      console.error("Decryption error:", error);
    } finally {
      setIsPastePasswordModalOpen(false);
      setPastedContent(null);
    }
  };

  return (
    <>
      <div className="save-load-controls">
        <button onClick={() => setIsSaveModalOpen(true)} className="save-button">Save Calendar</button>
        <button onClick={() => fileInputRef.current?.click()} className="load-button">Load Calendar</button>
        <button onClick={() => setIsCopyPasswordModalOpen(true)} className="copy-text-button">Copy as Text</button>
        <button onClick={() => setIsPasteTextModalOpen(true)} className="paste-text-button">Load from Text</button>
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

      <EncryptionModal
        isOpen={isCopyPasswordModalOpen}
        onClose={() => setIsCopyPasswordModalOpen(false)}
        onSubmit={handleCopyAsText}
        promptText="Enter a password to encrypt your schedule:"
      />

      <CopyTextModal
        isOpen={isCopyTextModalOpen}
        onClose={() => setIsCopyTextModalOpen(false)}
        text={copyText}
      />

      <PasteTextModal
        isOpen={isPasteTextModalOpen}
        onClose={() => setIsPasteTextModalOpen(false)}
        onSubmit={handlePasteSubmit}
      />

      <EncryptionModal
        isOpen={isPastePasswordModalOpen}
        onClose={() => {
          setIsPastePasswordModalOpen(false);
          setPastedContent(null);
        }}
        onSubmit={handleDecryptAndLoadText}
        promptText="Enter the password to decrypt your schedule:"
      />
    </>
  );
}
