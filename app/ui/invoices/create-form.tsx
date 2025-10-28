'use client';

import { PatientField, ComplaintsList, ComplaintsState } from '@/app/lib/definitions';
import Link from 'next/link';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createExamination, State } from '@/app/lib/actions';
import { useState, useActionState } from 'react';
import DiagnosisField, { SelectedDiagnosis } from './diagnosis';
import MedicationsField, { SelectedMedication } from './medications';

export default function Form({ patients }: { patients: PatientField[] }) {
  // manual complaints from checkboxes and text input
  const [manualComplaints, setManualComplaints] = useState<ComplaintsState>([]);
  const [otherComplaints, setOtherComplaints] = useState<string>('');
  // diagnoses selected from ICD component (with optional note)
  const [diagnosesSelected, setDiagnosesSelected] = useState<SelectedDiagnosis[]>([]);
  const [medicationsSelected, setMedicationsSelected] = useState<SelectedMedication[]>([]);
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

  const handleDiagnosisChange = (selectedDiagnosis: SelectedDiagnosis[]) => {
    setDiagnosesSelected(selectedDiagnosis);
  };

  const handleMedicationsChange = (selected: SelectedMedication[]) => {
    setMedicationsSelected(selected);
  };

  // consultations (doctor referrals) selected from checkboxes
  const [consultationsSelected, setConsultationsSelected] = useState<string[]>([]);

  // toggle to show/hide consultations block (collapsed by default)
  const [consultationsOpen, setConsultationsOpen] = useState(false);
  // toggle to show/hide sick leave block (collapsed by default)
  const [sickLeaveOpen, setSickLeaveOpen] = useState(false);

  const consultationOptions = [
    'Лікар загальної практики-сімейний лікар',
    'Лікар-психіатр',
    'Лікар-фтизіатр',
    'Лікар-стоматолог',
    'Завідувач МЧ',
  ];

  const handleConsultationCheckbox = (value: string) => {
    setConsultationsSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  // Before submitting, merge manual complaints + other. Diagnoses (with notes) are sent in a separate hidden field
  const combinedBase = [...manualComplaints];
  const combined = otherComplaints ? [...combinedBase, otherComplaints] : combinedBase;

    // Remove any existing hidden complaints input to avoid duplicates
    const existing = e.currentTarget.querySelector('input[name="complaints"]');
    if (existing) existing.remove();

  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.name = 'complaints';
  hidden.value = JSON.stringify(combined);
  e.currentTarget.appendChild(hidden);

    // attach diagnoses JSON (code, label, id, note)
  const diagHidden = document.createElement('input');
  diagHidden.type = 'hidden';
  diagHidden.name = 'diagnoses';
  diagHidden.value = JSON.stringify(diagnosesSelected || []);
  e.currentTarget.appendChild(diagHidden);

    // attach medications JSON (code, label, id, dose, note)
  const medsHidden = document.createElement('input');
  medsHidden.type = 'hidden';
  medsHidden.name = 'medications';
  medsHidden.value = JSON.stringify(medicationsSelected || []);
  e.currentTarget.appendChild(medsHidden);

    // attach consultations JSON (array of strings)
    const consultHidden = document.createElement('input');
    consultHidden.type = 'hidden';
    consultHidden.name = 'consultations';
    consultHidden.value = JSON.stringify(consultationsSelected || []);
    e.currentTarget.appendChild(consultHidden);
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
              onChange={async (e) => {
                const v = e.target.value;
                const id = v ? Number(v) : null;
                // fetch prescriptions for patient and prefill medications
                if (id) {
                  try {
                    const res = await fetch(`/api/prescriptions?patientId=${id}`);
                    if (res.ok) {
                      const rows = (await res.json()) as Array<{
                        medication_id: number | null;
                        dose: number | null;
                        frequency_per_day: number | null;
                        duration_days: number | null;
                        full_drug_name?: string | null;
                        start_date?: string | null;
                      }>;
                      const MS_PER_DAY = 1000 * 60 * 60 * 24;
                      const today = new Date();
                      // normalize to local midnight for day-diff calculation
                      today.setHours(0, 0, 0, 0);
                      const mapped: SelectedMedication[] = [];
                      for (const r of rows || []) {
                        // if start_date provided and in future -> skip
                        if (r.start_date) {
                          const start = new Date(r.start_date);
                          start.setHours(0, 0, 0, 0);
                          if (start.getTime() > today.getTime()) {
                            continue; // not started yet
                          }
                          const elapsed = Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
                          const remaining = (r.duration_days ?? 0) - elapsed;
                          if (remaining <= 0) continue; // course already finished
                          mapped.push({
                            id: r.medication_id ?? null,
                            code: String(r.medication_id ?? ''),
                            label: r.full_drug_name ?? `Препарат ${r.medication_id}`,
                            dose: r.dose != null ? String(r.dose) : null,
                            frequencyPerDay: r.frequency_per_day ?? null,
                            days: remaining,
                            prescriptionNumber: r.prescription_number ?? null,
                            note: null,
                          });
                        } else {
                          // no start_date -> use full duration
                          if ((r.duration_days ?? 0) <= 0) continue;
                          mapped.push({
                            id: r.medication_id ?? null,
                            code: String(r.medication_id ?? ''),
                            label: r.full_drug_name ?? `Препарат ${r.medication_id}`,
                            dose: r.dose != null ? String(r.dose) : null,
                            frequencyPerDay: r.frequency_per_day ?? null,
                            days: r.duration_days ?? null,
                            prescriptionNumber: r.prescription_number ?? null,
                            note: null,
                          });
                        }
                      }
                      setMedicationsSelected(mapped);
                    }
                  } catch (err) {
                    console.error('Failed to load prescriptions for patient', err);
                  }
                } else {
                  setMedicationsSelected([]);
                }
              }}
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

    <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Complaints */}
      <div className="form-field flex-auto">
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
      <div className="form-field flex-auto">
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
          <div className="mt-10 md:mt-0 w-full">
            <DiagnosisField onChange={handleDiagnosisChange} />
          </div>
          
        {/* Consultations and Sick leave: side-by-side on md+ screens, sick-leave on the right */}
        <div className="mt-4 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-field">
            <h3
              className="block font-semibold text-gray-800 cursor-pointer flex items-center gap-2"
              role="button"
              tabIndex={0}
              aria-expanded={consultationsOpen}
              onClick={() => setConsultationsOpen((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setConsultationsOpen((v) => !v);
                }
              }}
            >
              <span>Консультації</span>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transform transition-transform duration-200 ${consultationsOpen ? 'rotate-180' : 'rotate-0'}`}
                aria-hidden
              />
            </h3>

            {consultationsOpen && (
              <div className="flex flex-col space-y-2 mt-2">
                {consultationOptions.map((label) => (
                  <label key={label} className="flex items-center space-x-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="consultation"
                      value={label}
                      checked={consultationsSelected.includes(label)}
                      onChange={() => handleConsultationCheckbox(label)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sick leave / time off inputs (collapsible) */}
          <div className="form-field">
            <h3
              className="block font-semibold text-gray-800 cursor-pointer flex items-center gap-2"
              role="button"
              tabIndex={0}
              aria-expanded={sickLeaveOpen}
              onClick={() => setSickLeaveOpen((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSickLeaveOpen((v) => !v);
                }
              }}
            >
              <span>Звільнення від роботи</span>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transform transition-transform duration-200 ${sickLeaveOpen ? 'rotate-180' : 'rotate-0'}`}
                aria-hidden
              />
            </h3>

            {sickLeaveOpen && (
              <div className="grid grid-cols-1 gap-4 mt-2">
                <div>
                  <label htmlFor="start_date" className="block text-sm text-gray-700">З якої дати:</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm text-gray-700">До якої дати:</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Medications */}
        <div className="mt-10 md:mt-0 w-full">
          <MedicationsField onChange={handleMedicationsChange} initialSelected={medicationsSelected} />
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
