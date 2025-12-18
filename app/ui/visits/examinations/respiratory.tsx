'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export interface ExaminationsRespiratoryData {
  auscultation: string;
}

interface ExaminationsRespiratoryFieldProps {
  initialData?: Partial<ExaminationsRespiratoryData>;
  onChange?: (data: ExaminationsRespiratoryData) => void;
}

export default function ExaminationsRespiratoryField({ initialData, onChange }: ExaminationsRespiratoryFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [auscultation, setAuscultation] = useState<string>(initialData?.auscultation || '');

  const handleChange = (value: string) => {
    setAuscultation(value);

    if (onChange) {
      onChange({ auscultation: value });
    }
  };

  return (
    <>
      {/* Hidden input for form submission */}
      <input type="hidden" name="auscultation" value={auscultation} />

      <CollapsibleSection
        title="Дихальна система:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div>
          <label htmlFor="auscultation" className="mb-2 block text-sm font-medium">
            Аускультація легень
          </label>
          <textarea
            id="auscultation"
            name="auscultation"
            value={auscultation}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Опишіть дані аускультації легень"
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
            rows={3}
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
