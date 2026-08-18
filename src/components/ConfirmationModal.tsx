import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export function ConfirmationModal({ isOpen, message, onConfirm, onCancel, confirmLabel = 'Delete' }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Confirmation</h4>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="modal-button submit" onClick={onConfirm}>{confirmLabel}</button>
          <button className="modal-button cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
