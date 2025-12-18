'use client';

import { useState } from 'react';
import CollapsibleSection from '../collapsible-section';

export interface ExaminationsMentalData {
  rapport: string;
  orientation: string;
  delusions: string;
  intellect: string;
  perception: string;
  thought_process: string;
  memory: string;
}

interface ExaminationsMentalFieldProps {
  initialData?: Partial<ExaminationsMentalData>;
  onChange?: (data: ExaminationsMentalData) => void;
}

export default function ExaminationsMentalField({ initialData, onChange }: ExaminationsMentalFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [rapport, setRapport] = useState<string>(initialData?.rapport || '');
  const [orientation, setOrientation] = useState<string>(initialData?.orientation || '');
  const [delusions, setDelusions] = useState<string>(initialData?.delusions || '');
  const [intellect, setIntellect] = useState<string>(initialData?.intellect || '');
  const [perception, setPerception] = useState<string>(initialData?.perception || '');
  const [thoughtProcess, setThoughtProcess] = useState<string>(initialData?.thought_process || '');
  const [memory, setMemory] = useState<string>(initialData?.memory || '');

  const handleChange = (field: keyof ExaminationsMentalData, value: string) => {
    switch (field) {
      case 'rapport':
        setRapport(value);
        break;
      case 'orientation':
        setOrientation(value);
        break;
      case 'delusions':
        setDelusions(value);
        break;
      case 'intellect':
        setIntellect(value);
        break;
      case 'perception':
        setPerception(value);
        break;
      case 'thought_process':
        setThoughtProcess(value);
        break;
      case 'memory':
        setMemory(value);
        break;
    }

    if (onChange) {
      const currentData: ExaminationsMentalData = {
        rapport: field === 'rapport' ? value : rapport,
        orientation: field === 'orientation' ? value : orientation,
        delusions: field === 'delusions' ? value : delusions,
        intellect: field === 'intellect' ? value : intellect,
        perception: field === 'perception' ? value : perception,
        thought_process: field === 'thought_process' ? value : thoughtProcess,
        memory: field === 'memory' ? value : memory,
      };
      onChange(currentData);
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="rapport" value={rapport} />
      <input type="hidden" name="orientation" value={orientation} />
      <input type="hidden" name="delusions" value={delusions} />
      <input type="hidden" name="intellect" value={intellect} />
      <input type="hidden" name="perception" value={perception} />
      <input type="hidden" name="thought_process" value={thoughtProcess} />
      <input type="hidden" name="memory" value={memory} />

      <CollapsibleSection
        title="Психічний статус:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 gap-4">
          {/* Контакт */}
          <div>
            <label htmlFor="rapport" className="mb-2 block text-sm font-medium">
              Контакт
            </label>
            <textarea
              id="rapport"
              name="rapport"
              value={rapport}
              onChange={(e) => handleChange('rapport', e.target.value)}
              placeholder="Опишіть контакт з пацієнтом"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Орієнтація */}
          <div>
            <label htmlFor="orientation" className="mb-2 block text-sm font-medium">
              Орієнтація
            </label>
            <textarea
              id="orientation"
              name="orientation"
              value={orientation}
              onChange={(e) => handleChange('orientation', e.target.value)}
              placeholder="Орієнтація в часі, місці, особі"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Марення */}
          <div>
            <label htmlFor="delusions" className="mb-2 block text-sm font-medium">
              Марення
            </label>
            <textarea
              id="delusions"
              name="delusions"
              value={delusions}
              onChange={(e) => handleChange('delusions', e.target.value)}
              placeholder="Наявність маревних ідей"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Інтелект */}
          <div>
            <label htmlFor="intellect" className="mb-2 block text-sm font-medium">
              Інтелект
            </label>
            <textarea
              id="intellect"
              name="intellect"
              value={intellect}
              onChange={(e) => handleChange('intellect', e.target.value)}
              placeholder="Оцінка інтелектуальних здібностей"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Сприйняття */}
          <div>
            <label htmlFor="perception" className="mb-2 block text-sm font-medium">
              Сприйняття
            </label>
            <textarea
              id="perception"
              name="perception"
              value={perception}
              onChange={(e) => handleChange('perception', e.target.value)}
              placeholder="Особливості сприйняття (галюцинації, ілюзії)"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Мислення */}
          <div>
            <label htmlFor="thought_process" className="mb-2 block text-sm font-medium">
              Мислення
            </label>
            <textarea
              id="thought_process"
              name="thought_process"
              value={thoughtProcess}
              onChange={(e) => handleChange('thought_process', e.target.value)}
              placeholder="Особливості мисленнєвих процесів"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>

          {/* Пам'ять */}
          <div>
            <label htmlFor="memory" className="mb-2 block text-sm font-medium">
              Пам&apos;ять
            </label>
            <textarea
              id="memory"
              name="memory"
              value={memory}
              onChange={(e) => handleChange('memory', e.target.value)}
              placeholder="Оцінка пам'яті"
              className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
              rows={2}
            />
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
