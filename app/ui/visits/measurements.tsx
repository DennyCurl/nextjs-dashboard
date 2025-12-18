'use client';

import { useState } from 'react';
import CollapsibleSection from './collapsible-section';

export interface MeasurementsData {
  systolic_blood_pressure: string;
  diastolic_blood_pressure: string;
  heart_rate: string;
  temperature: string;
  respiratory_rate: string;
  saturation: string;
  height: string;
  weight: string;
  AS: string;
  AD: string;
  VOS: string;
  VOD: string;
}

interface MeasurementsFieldProps {
  initialData?: Partial<MeasurementsData>;
  onChange?: (data: MeasurementsData) => void;
}

export default function MeasurementsField({ initialData, onChange }: MeasurementsFieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [systolicBP, setSystolicBP] = useState<string>(initialData?.systolic_blood_pressure || '');
  const [diastolicBP, setDiastolicBP] = useState<string>(initialData?.diastolic_blood_pressure || '');
  const [heartRate, setHeartRate] = useState<string>(initialData?.heart_rate || '');
  const [temperature, setTemperature] = useState<string>(initialData?.temperature || '');
  const [respiratoryRate, setRespiratoryRate] = useState<string>(initialData?.respiratory_rate || '');
  const [saturation, setSaturation] = useState<string>(initialData?.saturation || '');
  const [height, setHeight] = useState<string>(initialData?.height || '');
  const [weight, setWeight] = useState<string>(initialData?.weight || '');
  const [AS, setAS] = useState<string>(initialData?.AS || '');
  const [AD, setAD] = useState<string>(initialData?.AD || '');
  const [VOS, setVOS] = useState<string>(initialData?.VOS || '');
  const [VOD, setVOD] = useState<string>(initialData?.VOD || '');

  const handleChange = (field: keyof MeasurementsData, value: string) => {
    const updates: Record<keyof MeasurementsData, (v: string) => void> = {
      systolic_blood_pressure: setSystolicBP,
      diastolic_blood_pressure: setDiastolicBP,
      heart_rate: setHeartRate,
      temperature: setTemperature,
      respiratory_rate: setRespiratoryRate,
      saturation: setSaturation,
      height: setHeight,
      weight: setWeight,
      AS: setAS,
      AD: setAD,
      VOS: setVOS,
      VOD: setVOD,
    };
    
    updates[field](value);

    if (onChange) {
      const currentData: MeasurementsData = {
        systolic_blood_pressure: field === 'systolic_blood_pressure' ? value : systolicBP,
        diastolic_blood_pressure: field === 'diastolic_blood_pressure' ? value : diastolicBP,
        heart_rate: field === 'heart_rate' ? value : heartRate,
        temperature: field === 'temperature' ? value : temperature,
        respiratory_rate: field === 'respiratory_rate' ? value : respiratoryRate,
        saturation: field === 'saturation' ? value : saturation,
        height: field === 'height' ? value : height,
        weight: field === 'weight' ? value : weight,
        AS: field === 'AS' ? value : AS,
        AD: field === 'AD' ? value : AD,
        VOS: field === 'VOS' ? value : VOS,
        VOD: field === 'VOD' ? value : VOD,
      };
      onChange(currentData);
    }
  };

  return (
    <>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="systolic_blood_pressure" value={systolicBP} />
      <input type="hidden" name="diastolic_blood_pressure" value={diastolicBP} />
      <input type="hidden" name="heart_rate" value={heartRate} />
      <input type="hidden" name="temperature" value={temperature} />
      <input type="hidden" name="respiratory_rate" value={respiratoryRate} />
      <input type="hidden" name="saturation" value={saturation} />
      <input type="hidden" name="height" value={height} />
      <input type="hidden" name="weight" value={weight} />
      <input type="hidden" name="AS" value={AS} />
      <input type="hidden" name="AD" value={AD} />
      <input type="hidden" name="VOS" value={VOS} />
      <input type="hidden" name="VOD" value={VOD} />

      <CollapsibleSection
        title="Вимірювання:"
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-2 mb-2">
          {/* Артеріальний тиск */}
          <div className="bg-red-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium text-red-700 whitespace-nowrap">АТ:</label>
              <div className="flex gap-1 items-center flex-1">
                <input
                  type="text"
                  id="systolic_blood_pressure"
                  value={systolicBP}
                  onChange={(e) => handleChange('systolic_blood_pressure', e.target.value)}
                  placeholder="САТ"
                  className="w-full rounded border border-red-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <span className="text-sm text-gray-400">/</span>
                <input
                  type="text"
                  id="diastolic_blood_pressure"
                  value={diastolicBP}
                  onChange={(e) => handleChange('diastolic_blood_pressure', e.target.value)}
                  placeholder="ДАТ"
                  className="w-full rounded border border-red-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* ЧСС */}
          <div className="bg-red-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="heart_rate" className="text-sm font-medium text-red-700 whitespace-nowrap">ЧСС:</label>
              <input
                type="text"
                id="heart_rate"
                value={heartRate}
                onChange={(e) => handleChange('heart_rate', e.target.value)}
                placeholder="уд/хв"
                className="w-full rounded border border-red-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Температура */}
          <div className="bg-orange-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="temperature" className="text-sm font-medium text-orange-700 whitespace-nowrap">t°C:</label>
              <input
                type="text"
                id="temperature"
                value={temperature}
                onChange={(e) => handleChange('temperature', e.target.value)}
                placeholder="°C"
                className="w-full rounded border border-orange-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* ЧДР */}
          <div className="bg-cyan-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="respiratory_rate" className="text-sm font-medium text-cyan-700 whitespace-nowrap">ЧДР:</label>
              <input
                type="text"
                id="respiratory_rate"
                value={respiratoryRate}
                onChange={(e) => handleChange('respiratory_rate', e.target.value)}
                placeholder="дих/хв"
                className="w-full rounded border border-cyan-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* SpO2 */}
          <div className="bg-cyan-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="saturation" className="text-sm font-medium text-cyan-700 whitespace-nowrap">SpO₂:</label>
              <input
                type="text"
                id="saturation"
                value={saturation}
                onChange={(e) => handleChange('saturation', e.target.value)}
                placeholder="%"
                className="w-full rounded border border-cyan-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Зріст */}
          <div className="bg-green-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="height" className="text-sm font-medium text-green-700 whitespace-nowrap">Зріст:</label>
              <input
                type="text"
                id="height"
                value={height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="см"
                className="w-full rounded border border-green-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Вага */}
          <div className="bg-green-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="weight" className="text-sm font-medium text-green-700 whitespace-nowrap">Вага:</label>
              <input
                type="text"
                id="weight"
                value={weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="кг"
                className="w-full rounded border border-green-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Зір і слух */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          {/* Гострота зору правого ока */}
          <div className="bg-indigo-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="VOS" className="text-sm font-medium text-indigo-700 whitespace-nowrap">Visus OD:</label>
              <input
                type="text"
                id="VOS"
                value={VOS}
                onChange={(e) => handleChange('VOS', e.target.value)}
                placeholder="0.0"
                className="w-full rounded border border-indigo-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Гострота зору лівого ока */}
          <div className="bg-indigo-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="VOD" className="text-sm font-medium text-indigo-700 whitespace-nowrap">Visus OS:</label>
              <input
                type="text"
                id="VOD"
                value={VOD}
                onChange={(e) => handleChange('VOD', e.target.value)}
                placeholder="0.0"
                className="w-full rounded border border-indigo-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Гострота слуху праворуч */}
          <div className="bg-violet-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="AS" className="text-sm font-medium text-violet-700 whitespace-nowrap">Слух AD:</label>
              <input
                type="text"
                id="AS"
                value={AS}
                onChange={(e) => handleChange('AS', e.target.value)}
                placeholder="дБ"
                className="w-full rounded border border-violet-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Гострота слуху ліворуч */}
          <div className="bg-violet-50 p-1.5 rounded">
            <div className="flex items-center gap-1">
              <label htmlFor="AD" className="text-sm font-medium text-violet-700 whitespace-nowrap">Слух AS:</label>
              <input
                type="text"
                id="AD"
                value={AD}
                onChange={(e) => handleChange('AD', e.target.value)}
                placeholder="дБ"
                className="w-full rounded border border-violet-200 px-2 py-1 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>
    </>
  );
}
