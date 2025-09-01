import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationModal({ isOpen, message, onConfirm, onCancel }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Confirmation</h4>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="modal-button submit" onClick={onConfirm}>Delete</button>
          <button className="modal-button cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
