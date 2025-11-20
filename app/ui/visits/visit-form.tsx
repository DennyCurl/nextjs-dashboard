'use client';

import { PatientField, ComplaintsList, ComplaintsState, type VisitForm } from '@/app/lib/definitions';
import Link from 'next/link';
import { UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createExamination, updateVisit, State } from '@/app/lib/actions';
import { useState, useActionState } from 'react';
import DiagnosisField from './diagnosis';
import MedicationsField from './medications';
import type { SelectedDiagnosis, SelectedMedication } from '@/app/lib/definitions';

interface VisitFormProps {
  patients: PatientField[];
  visit?: VisitForm; // Optional for edit mode
  isEditing?: boolean;
}

export default function VisitForm({ patients, visit, isEditing = false }: VisitFormProps) {
  // Initialize state with existing visit data or defaults
  const [manualComplaints, setManualComplaints] = useState<ComplaintsState>(
    visit?.complaints ? JSON.parse(visit.complaints) : []
  );
  const [otherComplaints, setOtherComplaints] = useState<string>(
    visit?.other_complaints || ''
  );
  const [diagnosesSelected, setDiagnosesSelected] = useState<SelectedDiagnosis[]>(
    visit?.diagnoses ? JSON.parse(visit.diagnoses) : []
  );
  const [medicationsSelected, setMedicationsSelected] = useState<SelectedMedication[]>(
    visit?.medications ? JSON.parse(visit.medications) : []
  );
  const [shouldExpandMedications, setShouldExpandMedications] = useState<boolean>(
    visit?.medications ? JSON.parse(visit.medications).length > 0 : false
  );
  const [bloodPressure, setBloodPressure] = useState<string>(visit?.blood_pressure || '');
  const [heartRate, setHeartRate] = useState<string>(visit?.heart_rate || '');
  const [temperatureVal, setTemperatureVal] = useState<string>(visit?.temperature || '');
  const [examinationText, setExaminationText] = useState<string>(visit?.examination || '');

  const initialState: State = { message: null, errors: {} };
  
  // Choose action based on mode
  const action = isEditing && visit ? updateVisit.bind(null, visit.id) : createExamination;
  const [state, formAction] = useActionState(action, initialState);

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
    setManualComplaints((prev: ComplaintsState) =>
      prev.includes(value) ? prev.filter((v: string) => v !== value) : [...prev, value]
    );
  };

  const handleOtherComplaintsChange = (value: string) => {
    setOtherComplaints(value);
  };

  const handleDiagnosisChange = (selectedDiagnosis: SelectedDiagnosis[]) => {
    setDiagnosesSelected(selectedDiagnosis);
  };

  const handleMedicationsChange = (selected: SelectedMedication[]) => {
    setMedicationsSelected(selected);
  };

  const [consultationsSelected, setConsultationsSelected] = useState<string[]>(
    visit?.consultations ? JSON.parse(visit.consultations) : []
  );
  const [consultationsOpen, setConsultationsOpen] = useState(false);
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
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // Auto-load prescriptions when patient is selected (for create mode)
  const handlePatientChange = async (patientId: string) => {
    if (!isEditing && patientId) {
      try {
        const response = await fetch(`/api/prescriptions?patientId=${patientId}`);
        if (response.ok) {
          const data = await response.json();
          const rows = data.prescriptions || [];
          if (rows.length > 0) {
            interface PrescriptionRow {
              medication_id?: number | null;
              full_drug_name?: string | null;
              dose?: number | null;
              frequency_per_day?: number | null;
              duration_days?: number | null;
              start_date?: string | null;
              prescription_number?: string | null;
              available_quantity?: number | null;
              unit?: string | null;
              total_dispensed_days?: number | null;
              remaining_days?: number | null;
            }
            const MS_PER_DAY = 1000 * 60 * 60 * 24;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const mapped: SelectedMedication[] = [];
            for (const r of rows as PrescriptionRow[]) {
              let daysToShow = r.remaining_days ?? 0;
              let isFullyDispensed = false;
              let isPrescriptionValid = true;

              if (r.start_date) {
                const start = new Date(r.start_date);
                start.setHours(0, 0, 0, 0);
                if (start.getTime() > today.getTime()) {
                  continue;
                }
                const elapsed = Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
                const timeRemaining = (r.duration_days ?? 0) - elapsed;
                isPrescriptionValid = timeRemaining > 0;
                daysToShow = Math.min(daysToShow, Math.max(0, timeRemaining));
              }

              isFullyDispensed = (r.remaining_days ?? 0) <= 0 && (r.total_dispensed_days ?? 0) > 0;
              const shouldShow = daysToShow > 0 || (isFullyDispensed && isPrescriptionValid);

              if (!shouldShow) continue;

              const labelText = r.full_drug_name ?? `Препарат ${r.medication_id}`;
              let dispensedInfo = '';

              if (isFullyDispensed && isPrescriptionValid) {
                dispensedInfo = ' [ВИДАНО ПОВНІСТЮ]';
              } else if ((r.total_dispensed_days ?? 0) > 0) {
                dispensedInfo = ` (видано: ${r.total_dispensed_days} днів)`;
              }

              mapped.push({
                id: r.medication_id ?? null,
                code: String(r.medication_id ?? ''),
                label: `${labelText}${dispensedInfo}`,
                dose: r.dose != null ? String(r.dose) : null,
                frequencyPerDay: r.frequency_per_day ?? null,
                days: isFullyDispensed && isPrescriptionValid ? 0 : daysToShow,
                prescriptionNumber: r.prescription_number ?? null,
                note: null,
                available_quantity: r.available_quantity ?? null,
                unit: r.unit ?? null,
              });
            }
            setMedicationsSelected(mapped);
            setShouldExpandMedications(mapped.length > 0);
          }
        }
      } catch (err) {
        console.error('Failed to load prescriptions for patient', err);
      }
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set('complaints', JSON.stringify(manualComplaints));
    formData.set('other_complaints', otherComplaints);
    formData.set('diagnoses', JSON.stringify(diagnosesSelected));
    formData.set('medications', JSON.stringify(medicationsSelected));
    formData.set('consultations', JSON.stringify(consultationsSelected));
    formData.set('blood_pressure', bloodPressure);
    formData.set('heart_rate', heartRate);
    formData.set('temperature', temperatureVal);
    formData.set('examination', examinationText);

    formAction(formData);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Patient Selection */}
        <div className="mb-4">
          <label htmlFor="patient" className="mb-2 block text-sm font-medium">
            Виберіть пацієнта
          </label>
          <div className="relative">
            <select
              id="patient"
              name="patientId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue={visit?.patient_id || ''}
              onChange={(e) => handlePatientChange(e.target.value)}
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

        {/* Complaints and Examination */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Complaints */}
          <div className="form-field flex-auto">
            <label className="block font-semibold text-gray-800 mb-2">
              {"Скарги пацієнта:"}
            </label>
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
              <textarea
                id="examination"
                name="examination"
                value={examinationText}
                onChange={(e) => setExaminationText(e.target.value)}
                placeholder="Огляд пацієнта..."
                rows={2}
                className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px]"
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
        <div className="mt-6 w-full">
          <DiagnosisField onChange={handleDiagnosisChange} />
        </div>

        {/* Consultations and Sick leave */}
        <div className="mt-6 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    defaultValue={visit?.sick_leave_from || ''}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm text-gray-700">До якої дати:</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    defaultValue={visit?.sick_leave_to || ''}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medications */}
        <div className="mt-6 w-full">
          <MedicationsField
            onChange={handleMedicationsChange}
            initialSelected={medicationsSelected}
            autoExpand={shouldExpandMedications}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/visits"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">{isEditing ? 'Оновити' : 'Створити'}</Button>
      </div>
    </form>
  );
}