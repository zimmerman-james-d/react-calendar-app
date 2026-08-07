import React, { useState } from 'react';

interface PasteTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export function PasteTextModal({ isOpen, onClose, onSubmit }: PasteTextModalProps) {
  const [text, setText] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    } else {
      alert('Please paste the saved calendar text.');
    }
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--wide">
        <h4>Paste the saved calendar text:</h4>
        <textarea
          className="copy-text-area"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here..."
          data-testid="paste-text-area"
        />
        <div className="modal-actions">
          <button onClick={handleSubmit} className="modal-button submit">Continue</button>
          <button onClick={handleClose} className="modal-button cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}
