'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export default function AnamesisVitaeInfectionsField({
  initialData,
  disabled = false,
}: {
  initialData?: {
    tuberculosis?: string;
    hiv?: string;
    art?: string;
    hcv?: string;
    hcv_treatment?: string;
    hbv?: string;
    hbv_treatment?: string;
    other_infectious?: string;
  };
  disabled?: boolean;
}) {
  const [tuberculosis, setTuberculosis] = useState(initialData?.tuberculosis || '');
  const [hiv, setHiv] = useState(initialData?.hiv || '');
  const [art, setArt] = useState(initialData?.art || '');
  const [hcv, setHcv] = useState(initialData?.hcv || '');
  const [hcvTreatment, setHcvTreatment] = useState(initialData?.hcv_treatment || '');
  const [hbv, setHbv] = useState(initialData?.hbv || '');
  const [hbvTreatment, setHbvTreatment] = useState(initialData?.hbv_treatment || '');
  const [otherInfectious, setOtherInfectious] = useState(initialData?.other_infectious || '');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <CollapsibleSection
      title="Інфекційні захворювання"
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Tuberculosis */}
        <div className="mb-4">
          <label htmlFor="tuberculosis" className="mb-2 block text-sm font-medium">
            Туберкульоз
          </label>
          <input
            id="tuberculosis"
            name="tuberculosis"
            type="text"
            value={tuberculosis}
            onChange={(e) => setTuberculosis(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* HIV */}
        <div className="mb-4">
          <label htmlFor="hiv" className="mb-2 block text-sm font-medium">
            ВІЛ
          </label>
          <input
            id="hiv"
            name="hiv"
            type="text"
            value={hiv}
            onChange={(e) => setHiv(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* ART */}
        <div className="mb-4">
          <label htmlFor="art" className="mb-2 block text-sm font-medium">
            АРТ (антиретровірусна терапія)
          </label>
          <input
            id="art"
            name="art"
            type="text"
            value={art}
            onChange={(e) => setArt(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* HCV */}
        <div className="mb-4">
          <label htmlFor="hcv" className="mb-2 block text-sm font-medium">
            Гепатит C
          </label>
          <input
            id="hcv"
            name="hcv"
            type="text"
            value={hcv}
            onChange={(e) => setHcv(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* HCV Treatment */}
        <div className="mb-4">
          <label htmlFor="hcv_treatment" className="mb-2 block text-sm font-medium">
            Лікування гепатиту C
          </label>
          <input
            id="hcv_treatment"
            name="hcv_treatment"
            type="text"
            value={hcvTreatment}
            onChange={(e) => setHcvTreatment(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* HBV */}
        <div className="mb-4">
          <label htmlFor="hbv" className="mb-2 block text-sm font-medium">
            Гепатит B
          </label>
          <input
            id="hbv"
            name="hbv"
            type="text"
            value={hbv}
            onChange={(e) => setHbv(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* HBV Treatment */}
        <div className="mb-4">
          <label htmlFor="hbv_treatment" className="mb-2 block text-sm font-medium">
            Лікування гепатиту B
          </label>
          <input
            id="hbv_treatment"
            name="hbv_treatment"
            type="text"
            value={hbvTreatment}
            onChange={(e) => setHbvTreatment(e.target.value)}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Other Infectious */}
        <div className="mb-4 md:col-span-2">
          <label htmlFor="other_infectious" className="mb-2 block text-sm font-medium">
            Інші інфекційні захворювання
          </label>
          <textarea
            id="other_infectious"
            name="other_infectious"
            value={otherInfectious}
            onChange={(e) => setOtherInfectious(e.target.value)}
            rows={3}
            disabled={disabled}
            className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="tuberculosis" value={tuberculosis} />
      <input type="hidden" name="hiv" value={hiv} />
      <input type="hidden" name="art" value={art} />
      <input type="hidden" name="hcv" value={hcv} />
      <input type="hidden" name="hcv_treatment" value={hcvTreatment} />
      <input type="hidden" name="hbv" value={hbv} />
      <input type="hidden" name="hbv_treatment" value={hbvTreatment} />
      <input type="hidden" name="other_infectious" value={otherInfectious} />
    </CollapsibleSection>
  );
}
