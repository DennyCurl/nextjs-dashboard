'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export interface ExaminationsGastrointestinalData {
  inspection: string;
  palpation: string;
  percussion: string;
  blumberg: boolean;
  liver: string;
  spleen: string;
  stool: string;
}

interface ExaminationsGastrointestinalFieldProps {
  initialData?: Partial<ExaminationsGastrointestinalData>;
  onChange?: (data: ExaminationsGastrointestinalData) => void;
}

export default function ExaminationsGastrointestinalField({ initialData, onChange }: ExaminationsGastrointestinalFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [inspection, setInspection] = useState<string>(initialData?.inspection || '');
  const [palpation, setPalpation] = useState<string>(initialData?.palpation || '');
  const [percussion, setPercussion] = useState<string>(initialData?.percussion || '');
  const [blumberg, setBlumberg] = useState<boolean>(initialData?.blumberg || false);
  const [liver, setLiver] = useState<string>(initialData?.liver || '');
  const [spleen, setSpleen] = useState<string>(initialData?.spleen || '');
  const [stool, setStool] = useState<string>(initialData?.stool || '');

  const handleChange = (field: keyof ExaminationsGastrointestinalData, value: string | boolean) => {
    switch (field) {
      case 'inspection':
        setInspection(value as string);
        break;
      case 'palpation':
        setPalpation(value as string);
        break;
      case 'percussion':
        setPercussion(value as string);
        break;
      case 'blumberg':
        setBlumberg(value as boolean);
        break;
      case 'liver':
        setLiver(value as string);
        break;
      case 'spleen':
        setSpleen(value as string);
        break;
      case 'stool':
        setStool(value as string);
        break;
    }

    if (onChange) {
      const currentData: ExaminationsGastrointestinalData = {
        inspection: field === 'inspection' ? value as string : inspection,
        palpation: field === 'palpation' ? value as string : palpation,
        percussion: field === 'percussion' ? value as string : percussion,
        blumberg: field === 'blumberg' ? value as boolean : blumberg,
        liver: field === 'liver' ? value as string : liver,
        spleen: field === 'spleen' ? value as string : spleen,
        stool: field === 'stool' ? value as string : stool,
      };
      onChange(currentData);
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="inspection" value={inspection} />
      <input type="hidden" name="palpation" value={palpation} />
      <input type="hidden" name="percussion" value={percussion} />
      <input type="hidden" name="blumberg" value={blumberg ? 'true' : 'false'} />
      <input type="hidden" name="liver" value={liver} />
      <input type="hidden" name="spleen" value={spleen} />
      <input type="hidden" name="stool" value={stool} />

      <CollapsibleSection
        title="Шлунково-кишкова система:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Огляд */}
          <div>
            <label htmlFor="inspection" className="mb-2 block text-sm font-medium">
              Огляд живота
            </label>
            <textarea
              id="inspection"
              name="inspection"
              value={inspection}
              onChange={(e) => handleChange('inspection', e.target.value)}
              placeholder="Опишіть огляд живота"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Пальпація */}
          <div>
            <label htmlFor="palpation" className="mb-2 block text-sm font-medium">
              Пальпація
            </label>
            <textarea
              id="palpation"
              name="palpation"
              value={palpation}
              onChange={(e) => handleChange('palpation', e.target.value)}
              placeholder="Опишіть результати пальпації"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Перкусія */}
          <div>
            <label htmlFor="percussion" className="mb-2 block text-sm font-medium">
              Перкусія
            </label>
            <textarea
              id="percussion"
              name="percussion"
              value={percussion}
              onChange={(e) => handleChange('percussion', e.target.value)}
              placeholder="Опишіть результати перкусії"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Симптом Блюмберга */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                id="blumberg"
                name="blumberg"
                checked={blumberg}
                onChange={(e) => handleChange('blumberg', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">Симптом Блюмберга позитивний</span>
            </label>
          </div>

          {/* Печінка */}
          <div>
            <label htmlFor="liver" className="mb-2 block text-sm font-medium">
              Печінка
            </label>
            <textarea
              id="liver"
              name="liver"
              value={liver}
              onChange={(e) => handleChange('liver', e.target.value)}
              placeholder="Опишіть стан печінки"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Селезінка */}
          <div>
            <label htmlFor="spleen" className="mb-2 block text-sm font-medium">
              Селезінка
            </label>
            <textarea
              id="spleen"
              name="spleen"
              value={spleen}
              onChange={(e) => handleChange('spleen', e.target.value)}
              placeholder="Опишіть стан селезінки"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Стілець */}
          <div>
            <label htmlFor="stool" className="mb-2 block text-sm font-medium">
              Стілець
            </label>
            <textarea
              id="stool"
              name="stool"
              value={stool}
              onChange={(e) => handleChange('stool', e.target.value)}
              placeholder="Опишіть характер стільця"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
