'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export interface ExaminationsCardiovascularData {
  auscultation_cardio: string;
  rhythm: string;
}

interface ExaminationsCardiovascularFieldProps {
  initialData?: Partial<ExaminationsCardiovascularData>;
  onChange?: (data: ExaminationsCardiovascularData) => void;
}

export default function ExaminationsCardiovascularField({ initialData, onChange }: ExaminationsCardiovascularFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [auscultationCardio, setAuscultationCardio] = useState<string>(initialData?.auscultation_cardio || '');
  const [rhythm, setRhythm] = useState<string>(initialData?.rhythm || '');

  const handleChange = (field: keyof ExaminationsCardiovascularData, value: string) => {
    if (field === 'auscultation_cardio') {
      setAuscultationCardio(value);
    } else if (field === 'rhythm') {
      setRhythm(value);
    }

    if (onChange) {
      const currentData: ExaminationsCardiovascularData = {
        auscultation_cardio: field === 'auscultation_cardio' ? value : auscultationCardio,
        rhythm: field === 'rhythm' ? value : rhythm,
      };
      onChange(currentData);
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="auscultation_cardio" value={auscultationCardio} />
      <input type="hidden" name="rhythm" value={rhythm} />

      <CollapsibleSection
        title="Серцево-судинна система:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Аускультація серця */}
          <div>
            <label htmlFor="auscultation_cardio" className="mb-2 block text-sm font-medium">
              Аускультація серця
            </label>
            <textarea
              id="auscultation_cardio"
              name="auscultation_cardio"
              value={auscultationCardio}
              onChange={(e) => handleChange('auscultation_cardio', e.target.value)}
              placeholder="Опишіть дані аускультації серця"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Ритм */}
          <div>
            <label htmlFor="rhythm" className="mb-2 block text-sm font-medium">
              Ритм
            </label>
            <textarea
              id="rhythm"
              name="rhythm"
              value={rhythm}
              onChange={(e) => handleChange('rhythm', e.target.value)}
              placeholder="Опишіть ритм серця"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
