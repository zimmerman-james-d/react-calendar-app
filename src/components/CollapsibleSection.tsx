import React, { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  initialOpen?: boolean;
}

export function CollapsibleSection({ title, children, initialOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  return (
    <div className="collapsible-section">
      <div className="collapsible-header" onClick={() => setIsOpen(!isOpen)}>
        <h2>{title}</h2>
        <span className="collapsible-icon">{isOpen ? '−' : '+'}</span>
      </div>
      <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
        {children}
      </div>
    </div>
  );
}
