'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export interface ExaminationsGeneralData {
  general_condition: string;
  consciousness: string;
}

interface ExaminationsGeneralFieldProps {
  initialData?: Partial<ExaminationsGeneralData>;
  onChange?: (data: ExaminationsGeneralData) => void;
}

export default function ExaminationsGeneralField({ initialData, onChange }: ExaminationsGeneralFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [generalCondition, setGeneralCondition] = useState<string>(initialData?.general_condition || '');
  const [consciousness, setConsciousness] = useState<string>(initialData?.consciousness || '');

  const handleChange = (field: keyof ExaminationsGeneralData, value: string) => {
    if (field === 'general_condition') {
      setGeneralCondition(value);
    } else if (field === 'consciousness') {
      setConsciousness(value);
    }

    if (onChange) {
      const currentData: ExaminationsGeneralData = {
        general_condition: field === 'general_condition' ? value : generalCondition,
        consciousness: field === 'consciousness' ? value : consciousness,
      };
      onChange(currentData);
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="general_condition" value={generalCondition} />
      <input type="hidden" name="consciousness" value={consciousness} />

      <CollapsibleSection
        title="Об'єктивний огляд:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Загальний стан */}
          <div>
            <label htmlFor="general_condition" className="mb-2 block text-sm font-medium">
              Загальний стан
            </label>
            <textarea
              id="general_condition"
              name="general_condition"
              value={generalCondition}
              onChange={(e) => handleChange('general_condition', e.target.value)}
              placeholder="Опишіть загальний стан пацієнта"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={3}
            />
          </div>

          {/* Свідомість */}
          <div>
            <label htmlFor="consciousness" className="mb-2 block text-sm font-medium">
              Свідомість
            </label>
            <textarea
              id="consciousness"
              name="consciousness"
              value={consciousness}
              onChange={(e) => handleChange('consciousness', e.target.value)}
              placeholder="Опишіть рівень свідомості"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={3}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
