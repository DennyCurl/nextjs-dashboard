'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  className = '',
}: CollapsibleSectionProps) {
  return (
    <div className={`form-field ${className}`}>
      <h3
        className="block font-semibold text-gray-800 cursor-pointer flex items-center gap-2 mb-2"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span>{title}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-500 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          aria-hidden
        />
      </h3>

      {isOpen && children}
    </div>
  );
}
