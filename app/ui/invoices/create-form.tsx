'use client';

import { PatientField, ComplaintsList, ComplaintsState } from '@/app/lib/definitions';
import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createExamination, State } from '@/app/lib/actions';
import { useState, useActionState } from 'react';
import DiagnosisField from './diagnosis';

export default function Form({ patients }: { patients: PatientField[] }) {
  // manual complaints from checkboxes and text input
  const [manualComplaints, setManualComplaints] = useState<ComplaintsState>([]);
  const [otherComplaints, setOtherComplaints] = useState<string>('');
  // diagnoses selected from ICD component
  const [diagnosesSelected, setDiagnosesSelected] = useState<string[]>([]);
  const [bloodPressure, setBloodPressure] = useState<string>('');
  const [heartRate, setHeartRate] = useState<string>('');
  const [temperatureVal, setTemperatureVal] = useState<string>('');
  const [examinationText, setExaminationText] = useState<string>('');

  const initialState: State = { message: null, errors: {} };
  const [state, formAction] = useActionState(createExamination, initialState);

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
    setManualComplaints((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };
  
  const handleOtherComplaintsChange = (value: string) => {
    // only update local state here; we will serialize on submit
    setOtherComplaints(value);
  };

  const handleDiagnosisChange = (selectedDiagnosis: string[]) => {
    setDiagnosesSelected(selectedDiagnosis);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  // Before submitting, merge manual complaints + ICD diagnoses + other
  const combinedBase = [...manualComplaints, ...diagnosesSelected];
  const combined = otherComplaints ? [...combinedBase, otherComplaints] : combinedBase;

    // Remove any existing hidden complaints input to avoid duplicates
    const existing = e.currentTarget.querySelector('input[name="complaints"]');
    if (existing) existing.remove();

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'complaints';
    hidden.value = JSON.stringify(combined);
    e.currentTarget.appendChild(hidden);
  };

  {/*useEffect(() => {
  console.log("Список скарг оновлено:", complaints);
  }, [complaints]);*/}


  return (
  <form action={formAction} onSubmit={onSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Patient Name */}
        <div className="mb-4">
          <div className="relative">
            <select
              id="patient"
              name="patientId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              aria-describedby="patient-error"
            >
              <option value="" disabled>
                Оберіть пацієнта
              </option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name}
                </option>
              ))}
            </select>
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div id="patient-error" aria-live="polite" aria-atomic="true">
            {state.errors?.patientId &&
            state.errors.patientId.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
            ))}
          </div>
        </div>

      <div className="flex flex-col md:flex-row items-start gap-6 w-full">

        {/* Complaints */}
        <div className="form-field mt-6 mr-6 flex-auto">
          <label className="block font-semibold text-gray-800 mb-2">
            {"Скарги на стан здоров'я:"}
          </label>
        <div className="flex flex-col space-y-1">
          {options.map(({ id, label }) => (
            <label
              key={id}
              htmlFor={id}
              className="flex items-center space-x-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                id={id}
                value={label}
                checked={manualComplaints.includes(label)}
                onChange={() => handleCheckboxChange(label)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{label}</span>
            </label>
          ))}
          <input
            type="text"
            id="other_complaint"
            value={otherComplaints}
            onChange={(e) => handleOtherComplaintsChange(e.target.value)}
            placeholder="або введіть інше..."
            className="mt-2 rounded-lg border border-gray-300 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
          <div id="comlaints-error" aria-live="polite" aria-atomic="true">
            {state.errors?.complaints &&
            state.errors.complaints.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
            ))}
          </div>
        </div>

        {/* Examinations */}
        <div className="form-field mt-6 flex-auto">
          <label className="block font-semibold text-gray-800 mb-2">
            {"Об'єктивний огляд:"}
          </label>
          <div className="flex flex-col space-y-2">
            <input
              type="text"
              id="blood_pressure"
              name="blood_pressure"
              value={bloodPressure}
              onChange={(e) => setBloodPressure(e.target.value)}
              placeholder="Введіть артеріальний тиск (мм рт. ст.)"
              className="mt-2 rounded-lg border border-gray-300 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              id="heart_rate"
              name="heart_rate"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="Введіть ЧСС (уд/хв)"
              className="mt-2 rounded-lg border border-gray-300 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              id="temperature"
              name="temperature"
              value={temperatureVal}
              onChange={(e) => setTemperatureVal(e.target.value)}
              placeholder="Введіть температуру (°C)"
              className="mt-2 rounded-lg border border-gray-300 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              id="examination"
              name="examination"
              value={examinationText}
              onChange={(e) => setExaminationText(e.target.value)}
              placeholder="Огляд пацієнта"
              className="mt-2 rounded-lg border border-gray-300 px-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div id="comlaints-error" aria-live="polite" aria-atomic="true">
            {state.errors?.complaints &&
            state.errors.complaints.map((error: string) => (
            <p className="mt-2 text-sm text-red-500" key={error}>
              {error}
            </p>
            ))}
          </div>
        </div>
        </div>          

        {/* Diagnosis */}
        <div className="mt-6 md:mt-0 md:w-full">
          <DiagnosisField onChange={handleDiagnosisChange} />
        </div>
        </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Відправити</Button>
      </div>
    </form>
  );
}
