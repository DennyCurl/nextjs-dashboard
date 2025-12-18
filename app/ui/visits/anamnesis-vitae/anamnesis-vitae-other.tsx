'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export default function AnamesisVitaeOtherField({
  initialData,
  disabled = false,
}: {
  initialData?: {
    surgeries?: string;
    injuries?: string;
    allergies?: string;
    disability?: string;
    other_diagnoses?: string;
    seizures?: string;
    seizures_start?: string;
    seizures_last?: string;
  };
  disabled?: boolean;
}) {
  const [surgeries, setSurgeries] = useState(initialData?.surgeries || '');
  const [injuries, setInjuries] = useState(initialData?.injuries || '');
  const [allergies, setAllergies] = useState(initialData?.allergies || '');
  const [disability, setDisability] = useState(initialData?.disability || '');
  const [otherDiagnoses, setOtherDiagnoses] = useState(initialData?.other_diagnoses || '');
  const [seizures, setSeizures] = useState(initialData?.seizures || '');
  const [seizuresStart, setSeizuresStart] = useState(initialData?.seizures_start || '');
  const [seizuresLast, setSeizuresLast] = useState(initialData?.seizures_last || '');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CollapsibleSection
      title="Анамнез життя"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Surgeries */}
        <div className="mb-4">
          <label htmlFor="surgeries" className="mb-2 block text-sm font-medium">
            Операції
          </label>
          <textarea
            id="surgeries"
            name="surgeries"
            value={surgeries}
            onChange={(e) => setSurgeries(e.target.value)}
            rows={3}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Injuries */}
        <div className="mb-4">
          <label htmlFor="injuries" className="mb-2 block text-sm font-medium">
            Травми
          </label>
          <textarea
            id="injuries"
            name="injuries"
            value={injuries}
            onChange={(e) => setInjuries(e.target.value)}
            rows={3}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Allergies */}
        <div className="mb-4">
          <label htmlFor="allergies" className="mb-2 block text-sm font-medium">
            Алергії
          </label>
          <textarea
            id="allergies"
            name="allergies"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            rows={3}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Disability */}
        <div className="mb-4">
          <label htmlFor="disability" className="mb-2 block text-sm font-medium">
            Інвалідність
          </label>
          <input
            id="disability"
            name="disability"
            type="text"
            value={disability}
            onChange={(e) => setDisability(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Other Diagnoses */}
        <div className="mb-4 md:col-span-2">
          <label htmlFor="other_diagnoses" className="mb-2 block text-sm font-medium">
            Інші діагнози в анамнезі
          </label>
          <textarea
            id="other_diagnoses"
            name="other_diagnoses"
            value={otherDiagnoses}
            onChange={(e) => setOtherDiagnoses(e.target.value)}
            rows={3}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Seizures */}
        <div className="mb-4 md:col-span-2">
          <label htmlFor="seizures" className="mb-2 block text-sm font-medium">
            Судоми
          </label>
          <textarea
            id="seizures"
            name="seizures"
            value={seizures}
            onChange={(e) => setSeizures(e.target.value)}
            rows={2}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Seizures Start */}
        <div className="mb-4">
          <label htmlFor="seizures_start" className="mb-2 block text-sm font-medium">
            Початок судом
          </label>
          <input
            id="seizures_start"
            name="seizures_start"
            type="text"
            value={seizuresStart}
            onChange={(e) => setSeizuresStart(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Seizures Last */}
        <div className="mb-4">
          <label htmlFor="seizures_last" className="mb-2 block text-sm font-medium">
            Останні судоми
          </label>
          <input
            id="seizures_last"
            name="seizures_last"
            type="text"
            value={seizuresLast}
            onChange={(e) => setSeizuresLast(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="surgeries" value={surgeries} />
      <input type="hidden" name="injuries" value={injuries} />
      <input type="hidden" name="allergies" value={allergies} />
      <input type="hidden" name="disability" value={disability} />
      <input type="hidden" name="other_diagnoses" value={otherDiagnoses} />
      <input type="hidden" name="seizures" value={seizures} />
      <input type="hidden" name="seizures_start" value={seizuresStart} />
      <input type="hidden" name="seizures_last" value={seizuresLast} />
    </CollapsibleSection>
  );
}
