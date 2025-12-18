'use client';

import { useState } from 'react';
import CollapsibleSection from './collapsible-section';

export interface AnamnesisMorbiData {
  anamnesis_morbi: string;
  duration: string;
}

interface AnamnesisMorbiFieldProps {
  initialData?: Partial<AnamnesisMorbiData>;
  onChange?: (data: AnamnesisMorbiData) => void;
}

export default function AnamnesisMorbiField({ initialData, onChange }: AnamnesisMorbiFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anamnesisMorbi, setAnamnesisMorbi] = useState<string>(initialData?.anamnesis_morbi || '');
  const [duration, setDuration] = useState<string>(initialData?.duration || '');

  const handleChange = (field: keyof AnamnesisMorbiData, value: string) => {
    if (field === 'anamnesis_morbi') {
      setAnamnesisMorbi(value);
    } else if (field === 'duration') {
      setDuration(value);
    }

    if (onChange) {
      const currentData: AnamnesisMorbiData = {
        anamnesis_morbi: field === 'anamnesis_morbi' ? value : anamnesisMorbi,
        duration: field === 'duration' ? value : duration,
      };
      onChange(currentData);
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="anamnesis_morbi" value={anamnesisMorbi} />
      <input type="hidden" name="duration" value={duration} />

      <CollapsibleSection
        title="Анамнез хвороби"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Тривалість */}
          <div>
            <label htmlFor="duration" className="mb-2 block text-sm font-medium">
              Тривалість захворювання
            </label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="Наприклад: 3 дні, 2 тижні"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
            />
          </div>

          {/* Анамнез хвороби */}
          <div>
            <label htmlFor="anamnesis_morbi" className="mb-2 block text-sm font-medium">
              Анамнез хвороби
            </label>
            <textarea
              id="anamnesis_morbi"
              name="anamnesis_morbi"
              value={anamnesisMorbi}
              onChange={(e) => handleChange('anamnesis_morbi', e.target.value)}
              placeholder="Опишіть розвиток захворювання"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={4}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
