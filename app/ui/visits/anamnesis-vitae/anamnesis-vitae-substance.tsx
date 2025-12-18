'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export default function AnamesisVitaeSubstanceField({
  initialData,
  disabled = false,
}: {
  initialData?: {
    addiction_specialist?: boolean;
    addiction_specialist_details?: string;
    alcohol_history?: string;
    alcohol_duration?: string;
    drug_history?: string;
    drug_start?: string;
    drug_last?: string;
    smoking_history?: string;
  };
  disabled?: boolean;
}) {
  const [addictionSpecialist, setAddictionSpecialist] = useState(initialData?.addiction_specialist || false);
  const [addictionSpecialistDetails, setAddictionSpecialistDetails] = useState(initialData?.addiction_specialist_details || '');
  const [alcoholHistory, setAlcoholHistory] = useState(initialData?.alcohol_history || '');
  const [alcoholDuration, setAlcoholDuration] = useState(initialData?.alcohol_duration || '');
  const [drugHistory, setDrugHistory] = useState(initialData?.drug_history || '');
  const [drugStart, setDrugStart] = useState(initialData?.drug_start || '');
  const [drugLast, setDrugLast] = useState(initialData?.drug_last || '');
  const [smokingHistory, setSmokingHistory] = useState(initialData?.smoking_history || '');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CollapsibleSection
      title="Наркологічний анамнез"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="space-y-4">
        {/* Addiction Specialist */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="addiction_specialist"
              checked={addictionSpecialist}
              onChange={(e) => setAddictionSpecialist(e.target.checked)}
              disabled={disabled}
              className="mr-2 h-4 w-4 rounded border-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium">Спостерігається у нарколога</span>
          </label>
        </div>

        {/* Addiction Specialist Details */}
        {addictionSpecialist && (
          <div className="mb-4">
            <label htmlFor="addiction_specialist_details" className="mb-2 block text-sm font-medium">
              Деталі спостереження у нарколога
            </label>
            <textarea
              id="addiction_specialist_details"
              name="addiction_specialist_details"
              value={addictionSpecialistDetails}
              onChange={(e) => setAddictionSpecialistDetails(e.target.value)}
              rows={3}
              disabled={disabled}
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Alcohol History */}
          <div className="mb-4">
            <label htmlFor="alcohol_history" className="mb-2 block text-sm font-medium">
              Вживання алкоголю
            </label>
            <textarea
              id="alcohol_history"
              name="alcohol_history"
              value={alcoholHistory}
              onChange={(e) => setAlcoholHistory(e.target.value)}
              rows={3}
              disabled={disabled}
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Alcohol Duration */}
          <div className="mb-4">
            <label htmlFor="alcohol_duration" className="mb-2 block text-sm font-medium">
              Тривалість вживання алкоголю
            </label>
            <input
              id="alcohol_duration"
              name="alcohol_duration"
              type="text"
              value={alcoholDuration}
              onChange={(e) => setAlcoholDuration(e.target.value)}
              disabled={disabled}
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Smoking History */}
          <div className="mb-4 md:col-span-2">
            <label htmlFor="smoking_history" className="mb-2 block text-sm font-medium">
              Куріння
            </label>
            <textarea
              id="smoking_history"
              name="smoking_history"
              value={smokingHistory}
              onChange={(e) => setSmokingHistory(e.target.value)}
              rows={3}
              disabled={disabled}
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Drug History */}
          <div className="mb-4 md:col-span-2">
            <label htmlFor="drug_history" className="mb-2 block text-sm font-medium">
              Вживання наркотичних речовин
            </label>
            <textarea
              id="drug_history"
              name="drug_history"
              value={drugHistory}
              onChange={(e) => setDrugHistory(e.target.value)}
              rows={3}
              disabled={disabled}
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Drug Start */}
          <div className="mb-4">
            <label htmlFor="drug_start" className="mb-2 block text-sm font-medium">
              Початок вживання наркотиків
            </label>
            <input
              id="drug_start"
              name="drug_start"
              type="text"
              value={drugStart}
              onChange={(e) => setDrugStart(e.target.value)}
              disabled={disabled}
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Drug Last */}
          <div className="mb-4">
            <label htmlFor="drug_last" className="mb-2 block text-sm font-medium">
              Останнє вживання наркотиків
            </label>
            <input
              id="drug_last"
              name="drug_last"
              type="text"
              value={drugLast}
              onChange={(e) => setDrugLast(e.target.value)}
              disabled={disabled}
              className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="addiction_specialist" value={addictionSpecialist ? 'true' : 'false'} />
      <input type="hidden" name="addiction_specialist_details" value={addictionSpecialistDetails} />
      <input type="hidden" name="alcohol_history" value={alcoholHistory} />
      <input type="hidden" name="alcohol_duration" value={alcoholDuration} />
      <input type="hidden" name="drug_history" value={drugHistory} />
      <input type="hidden" name="drug_start" value={drugStart} />
      <input type="hidden" name="drug_last" value={drugLast} />
      <input type="hidden" name="smoking_history" value={smokingHistory} />
    </CollapsibleSection>
  );
}
