import React, { useState } from 'react';

interface CopyTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export function CopyTextModal({ isOpen, onClose, text }: CopyTextModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access can be blocked by browser/IT policy on shared
      // computers. The textarea below is the fallback: the user can still
      // select-all and copy manually, so no error is shown here.
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--wide">
        <h4>Copy this text and paste it wherever you'd like to save it (e.g. a Teams message):</h4>
        <textarea
          className="copy-text-area"
          value={text}
          readOnly
          onFocus={(e) => e.target.select()}
          data-testid="copy-text-area"
        />
        <div className="modal-actions">
          <button onClick={handleCopy} className="modal-button submit">{copied ? 'Copied!' : 'Copy to Clipboard'}</button>
          <button onClick={handleClose} className="modal-button cancel">Done</button>
        </div>
      </div>
    </div>
  );
}
