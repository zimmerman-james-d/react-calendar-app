import React, { useState } from 'react';

interface EncryptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  promptText: string;
}

export function EncryptionModal({ isOpen, onClose, onSubmit, promptText }: EncryptionModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    if (password) {
      onSubmit(password);
      setPassword('');
    } else {
      alert("Please enter a password.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>{promptText}</h4>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="password-input"
          placeholder="Enter password..."
        />
        <div className="modal-actions">
          <button onClick={handleSubmit} className="modal-button submit">Confirm</button>
          <button onClick={onClose} className="modal-button cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}
