'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export interface ExaminationsExternalData {
  skin: string;
  mucous: string;
  swelling: string;
}

interface ExaminationsExternalFieldProps {
  initialData?: Partial<ExaminationsExternalData>;
  onChange?: (data: ExaminationsExternalData) => void;
}

export default function ExaminationsExternalField({ initialData, onChange }: ExaminationsExternalFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [skin, setSkin] = useState<string>(initialData?.skin || '');
  const [mucous, setMucous] = useState<string>(initialData?.mucous || '');
  const [swelling, setSwelling] = useState<string>(initialData?.swelling || '');

  const handleChange = (field: keyof ExaminationsExternalData, value: string) => {
    if (field === 'skin') {
      setSkin(value);
    } else if (field === 'mucous') {
      setMucous(value);
    } else if (field === 'swelling') {
      setSwelling(value);
    }

    if (onChange) {
      const currentData: ExaminationsExternalData = {
        skin: field === 'skin' ? value : skin,
        mucous: field === 'mucous' ? value : mucous,
        swelling: field === 'swelling' ? value : swelling,
      };
      onChange(currentData);
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="skin" value={skin} />
      <input type="hidden" name="mucous" value={mucous} />
      <input type="hidden" name="swelling" value={swelling} />

      <CollapsibleSection
        title="Зовнішній огляд:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Шкіра */}
          <div>
            <label htmlFor="skin" className="mb-2 block text-sm font-medium">
              Шкіра
            </label>
            <textarea
              id="skin"
              name="skin"
              value={skin}
              onChange={(e) => handleChange('skin', e.target.value)}
              placeholder="Опишіть стан шкіри"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Слизові */}
          <div>
            <label htmlFor="mucous" className="mb-2 block text-sm font-medium">
              Слизові
            </label>
            <textarea
              id="mucous"
              name="mucous"
              value={mucous}
              onChange={(e) => handleChange('mucous', e.target.value)}
              placeholder="Опишіть стан слизових"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Набряки */}
          <div>
            <label htmlFor="swelling" className="mb-2 block text-sm font-medium">
              Набряки
            </label>
            <textarea
              id="swelling"
              name="swelling"
              value={swelling}
              onChange={(e) => handleChange('swelling', e.target.value)}
              placeholder="Опишіть наявність набряків"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
