'use client';

import { useState } from 'react';
import CollapsibleSection from './collapsible-section';
import type { ComplaintsList, ComplaintsState } from '@/app/lib/definitions';

export interface ComplaintsData {
  complaints: string[];
  other_complaints: string;
}

interface ComplaintsFieldProps {
  initialData?: Partial<ComplaintsData>;
  onChange?: (data: ComplaintsData) => void;
}

export default function ComplaintsField({ initialData, onChange }: ComplaintsFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [manualComplaints, setManualComplaints] = useState<ComplaintsState>(
    initialData?.complaints || []
  );
  const [otherComplaints, setOtherComplaints] = useState<string>(
    initialData?.other_complaints || ''
  );

  const options: ComplaintsList = [
    { id: 'no_complaint', label: 'не висловлює' },
    { id: 'headache', label: 'головний біль' },
    { id: 'weakness', label: 'загальна слабкість' },
    { id: 'runny_nose', label: 'нежить' },
    { id: 'cough', label: 'кашель' },
    { id: 'stomach_pain', label: 'біль в животі' },
    { id: 'back_pain', label: 'біль в спині' },
  ];

  const handleCheckboxChange = (value: string) => {
    const newComplaints = manualComplaints.includes(value)
      ? manualComplaints.filter((v: string) => v !== value)
      : [...manualComplaints, value];
    
    setManualComplaints(newComplaints);
    
    if (onChange) {
      onChange({
        complaints: newComplaints,
        other_complaints: otherComplaints,
      });
    }
  };

  const handleOtherComplaintsChange = (value: string) => {
    setOtherComplaints(value);
    
    if (onChange) {
      onChange({
        complaints: manualComplaints,
        other_complaints: value,
      });
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="complaints" value={JSON.stringify(manualComplaints)} />
      <input type="hidden" name="other_complaints" value={otherComplaints} />

      <CollapsibleSection
        title="Скарги пацієнта:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="flex flex-col space-y-1">
          {options.map(({ id, label }) => {
            const inputId = `complaint-${id}`;
            return (
              <label
                key={id}
                htmlFor={inputId}
                className="flex items-center space-x-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id={inputId}
                  value={label}
                  checked={manualComplaints.includes(label)}
                  onChange={() => handleCheckboxChange(label)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{label}</span>
              </label>
            );
          })}
          <input
            type="text"
            id="other_complaint"
            value={otherComplaints}
            onChange={(e) => handleOtherComplaintsChange(e.target.value)}
            placeholder="або введіть інше..."
            className="mt-2 rounded-lg border border-gray-300 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </CollapsibleSection>
    </>
  );
}
