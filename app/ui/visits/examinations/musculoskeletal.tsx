'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export interface ExaminationsMusculoskeletalData {
  musculoskeletal: string;
}

interface ExaminationsMusculoskeletalFieldProps {
  initialData?: Partial<ExaminationsMusculoskeletalData>;
  onChange?: (data: ExaminationsMusculoskeletalData) => void;
}

export default function ExaminationsMusculoskeletalField({ initialData, onChange }: ExaminationsMusculoskeletalFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [musculoskeletal, setMusculoskeletal] = useState<string>(initialData?.musculoskeletal || '');

  const handleChange = (value: string) => {
    setMusculoskeletal(value);

    if (onChange) {
      onChange({ musculoskeletal: value });
    }
  };

  return (
    <>
      {/* Hidden input for form submission */}
      <input type="hidden" name="musculoskeletal" value={musculoskeletal} />

      <CollapsibleSection
        title="Опорно-рухова система:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div>
          <label htmlFor="musculoskeletal" className="mb-2 block text-sm font-medium">
            Стан опорно-рухової системи
          </label>
          <textarea
            id="musculoskeletal"
            name="musculoskeletal"
            value={musculoskeletal}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Опишіть стан опорно-рухової системи"
            className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
            rows={3}
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
