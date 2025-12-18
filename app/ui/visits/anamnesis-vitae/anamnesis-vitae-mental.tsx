'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export default function AnamesisVitaeMentalField({
  initialData,
  disabled = false,
}: {
  initialData?: {
    psychiatrist_care?: boolean;
    psychiatrist_details?: string;
    family_psychiatric_history?: string;
    self_injurious?: boolean;
    self_injurious_date?: string;
    self_injurious_cause?: string;
  };
  disabled?: boolean;
}) {
  const [psychiatristCare, setPsychiatristCare] = useState(initialData?.psychiatrist_care || false);
  const [psychiatristDetails, setPsychiatristDetails] = useState(initialData?.psychiatrist_details || '');
  const [familyPsychiatricHistory, setFamilyPsychiatricHistory] = useState(initialData?.family_psychiatric_history || '');
  const [selfInjurious, setSelfInjurious] = useState(initialData?.self_injurious || false);
  const [selfInjuriousDate, setSelfInjuriousDate] = useState(initialData?.self_injurious_date || '');
  const [selfInjuriousCause, setSelfInjuriousCause] = useState(initialData?.self_injurious_cause || '');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CollapsibleSection
      title="Психіатричний анамнез"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="space-y-4">
        {/* Psychiatrist Care */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="psychiatrist_care"
              checked={psychiatristCare}
              onChange={(e) => setPsychiatristCare(e.target.checked)}
              disabled={disabled}
              className="mr-2 h-4 w-4 rounded border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium">Спостерігається у психіатра</span>
          </label>
        </div>

        {/* Psychiatrist Details */}
        {psychiatristCare && (
          <div className="mb-4">
            <label htmlFor="psychiatrist_details" className="mb-2 block text-sm font-medium">
              Деталі спостереження у психіатра
            </label>
            <textarea
              id="psychiatrist_details"
              name="psychiatrist_details"
              value={psychiatristDetails}
              onChange={(e) => setPsychiatristDetails(e.target.value)}
              rows={3}
              disabled={disabled}
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        )}

        {/* Family Psychiatric History */}
        <div className="mb-4">
          <label htmlFor="family_psychiatric_history" className="mb-2 block text-sm font-medium">
            Сімейний психіатричний анамнез
          </label>
          <textarea
            id="family_psychiatric_history"
            name="family_psychiatric_history"
            value={familyPsychiatricHistory}
            onChange={(e) => setFamilyPsychiatricHistory(e.target.value)}
            rows={3}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Self Injurious */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="self_injurious"
              checked={selfInjurious}
              onChange={(e) => setSelfInjurious(e.target.checked)}
              disabled={disabled}
              className="mr-2 h-4 w-4 rounded border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium">Самоушкодження в анамнезі</span>
          </label>
        </div>

        {/* Self Injurious Details */}
        {selfInjurious && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="mb-4">
              <label htmlFor="self_injurious_date" className="mb-2 block text-sm font-medium">
                Дата самоушкодження
              </label>
              <input
                id="self_injurious_date"
                name="self_injurious_date"
                type="text"
                value={selfInjuriousDate}
                onChange={(e) => setSelfInjuriousDate(e.target.value)}
                disabled={disabled}
                className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div className="mb-4 md:col-span-2">
              <label htmlFor="self_injurious_cause" className="mb-2 block text-sm font-medium">
                Причина самоушкодження
              </label>
              <textarea
                id="self_injurious_cause"
                name="self_injurious_cause"
                value={selfInjuriousCause}
                onChange={(e) => setSelfInjuriousCause(e.target.value)}
                rows={3}
                disabled={disabled}
                className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )}
      </div>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="psychiatrist_care" value={psychiatristCare ? 'true' : 'false'} />
      <input type="hidden" name="psychiatrist_details" value={psychiatristDetails} />
      <input type="hidden" name="family_psychiatric_history" value={familyPsychiatricHistory} />
      <input type="hidden" name="self_injurious" value={selfInjurious ? 'true' : 'false'} />
      <input type="hidden" name="self_injurious_date" value={selfInjuriousDate} />
      <input type="hidden" name="self_injurious_cause" value={selfInjuriousCause} />
    </CollapsibleSection>
  );
}
