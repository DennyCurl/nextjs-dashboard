'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export interface ExaminationsGenitourinaryData {
  pasternatski: string;
  urination: string;
}

interface ExaminationsGenitourinaryFieldProps {
  initialData?: Partial<ExaminationsGenitourinaryData>;
  onChange?: (data: ExaminationsGenitourinaryData) => void;
}

export default function ExaminationsGenitourinaryField({ initialData, onChange }: ExaminationsGenitourinaryFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [pasternatski, setPasternatski] = useState<string>(initialData?.pasternatski || '');
  const [urination, setUrination] = useState<string>(initialData?.urination || '');

  const handleChange = (field: keyof ExaminationsGenitourinaryData, value: string) => {
    switch (field) {
      case 'pasternatski':
        setPasternatski(value);
        break;
      case 'urination':
        setUrination(value);
        break;
    }

    if (onChange) {
      const currentData: ExaminationsGenitourinaryData = {
        pasternatski: field === 'pasternatski' ? value : pasternatski,
        urination: field === 'urination' ? value : urination,
      };
      onChange(currentData);
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="pasternatski" value={pasternatski} />
      <input type="hidden" name="urination" value={urination} />

      <CollapsibleSection
        title="Сечостатева система:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Симптом Пастернацького */}
          <div>
            <label htmlFor="pasternatski" className="mb-2 block text-sm font-medium">
              Симптом Пастернацького
            </label>
            <textarea
              id="pasternatski"
              name="pasternatski"
              value={pasternatski}
              onChange={(e) => handleChange('pasternatski', e.target.value)}
              placeholder="Опишіть симптом Пастернацького"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Сечовипускання */}
          <div>
            <label htmlFor="urination" className="mb-2 block text-sm font-medium">
              Сечовипускання
            </label>
            <textarea
              id="urination"
              name="urination"
              value={urination}
              onChange={(e) => handleChange('urination', e.target.value)}
              placeholder="Опишіть характер сечовипускання"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
