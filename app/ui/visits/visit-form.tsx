'use client';

import { PatientField, type VisitForm } from '@/app/lib/definitions';
import Link from 'next/link';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createExamination, updateVisit, State } from '@/app/lib/actions';
import { useState, useActionState, useCallback } from 'react';
import DiagnosisField from './diagnosis';
import MedicationsField from './medications';
import MeasurementsField from './measurements';
import ComplaintsField from './complaints';
import AnamesisVitaeInfectionsField from './anamnesis-vitae/anamnesis-vitae-infections';
import AnamesisVitaeOtherField from './anamnesis-vitae/anamnesis-vitae-other';
import AnamesisVitaeSubstanceField from './anamnesis-vitae/anamnesis-vitae-substance';
import AnamesisVitaeMentalField from './anamnesis-vitae/anamnesis-vitae-mental';
import AnamnesisMorbiField from './anamnesis-morbi';
import ExaminationsGeneralField from './examinations/general';
import ExaminationsExternalField from './examinations/external';
import ExaminationsMusculoskeletalField from './examinations/musculoskeletal';
import ExaminationsRespiratoryField from './examinations/respiratory';
import ExaminationsCardiovascularField from './examinations/cardiovascular';
import ExaminationsGastrointestinalField from './examinations/gastrointestinal';
import ExaminationsGenitourinaryField from './examinations/genitourinary';
import ExaminationsMentalField from './examinations/mental';
import CollapsibleSection from './collapsible-section';
import type { SelectedDiagnosis, SelectedMedication } from '@/app/lib/definitions';

interface VisitFormProps {
  patients: PatientField[];
  visit?: VisitForm; // Optional for edit mode
  isEditing?: boolean;
}

export default function VisitForm({ patients, visit, isEditing = false }: VisitFormProps) {
  // Initialize state with existing visit data or defaults
  const [diagnosesSelected, setDiagnosesSelected] = useState<SelectedDiagnosis[]>(
    visit?.diagnoses ? JSON.parse(visit.diagnoses) : []
  );
  const [medicationsSelected, setMedicationsSelected] = useState<SelectedMedication[]>(
    visit?.medications ? JSON.parse(visit.medications) : []
  );
  const [shouldExpandMedications, setShouldExpandMedications] = useState<boolean>(
    visit?.medications ? JSON.parse(visit.medications).length > 0 : false
  );

  // Anamnesi Vitae state
  const [anamnesiVitaeData, setAnamnesiVitaeData] = useState<Record<string, string | boolean | null> | null>(null);
  const [anamnesiVitaeUnchanged, setAnamnesiVitaeUnchanged] = useState(visit?.anamnesis_vitae_unchanged || false);
  const [loadingAnamnesiVitae, setLoadingAnamnesiVitae] = useState(false);

  const initialState: State = { message: null, errors: {} };
  
  // Choose action based on mode
  const action = isEditing && visit ? updateVisit.bind(null, visit.id) : createExamination;
  const [state, formAction] = useActionState(action, initialState);

  const handleDiagnosisChange = useCallback((selectedDiagnosis: SelectedDiagnosis[]) => {
    setDiagnosesSelected(selectedDiagnosis);
  }, []);

  const handleMedicationsChange = useCallback((selected: SelectedMedication[]) => {
    setMedicationsSelected(selected);
  }, []);

  const [consultationsSelected, setConsultationsSelected] = useState<string[]>(
    visit?.consultations ? JSON.parse(visit.consultations) : []
  );
  const [anamnesiVitaeOpen, setAnamnesiVitaeOpen] = useState(false);
  const [examinationsOpen, setExaminationsOpen] = useState(false);
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
      // Load prescriptions
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

      // Load anamnesi vitae
      setLoadingAnamnesiVitae(true);
      try {
        const response = await fetch(`/api/anamnesi-vitae?patientId=${patientId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && Object.keys(data).length > 0) {
            setAnamnesiVitaeData(data);
            setAnamnesiVitaeUnchanged(true);
          }
        }
      } catch (err) {
        console.error('Failed to load anamnesi vitae for patient', err);
      } finally {
        setLoadingAnamnesiVitae(false);
      }
    }
  };

  return (
    <form action={formAction}>
      {/* Hidden inputs for state data */}
      <input type="hidden" name="diagnoses" value={JSON.stringify(diagnosesSelected)} />
      <input type="hidden" name="medications" value={JSON.stringify(medicationsSelected)} />
      <input type="hidden" name="consultations" value={JSON.stringify(consultationsSelected)} />
      <input type="hidden" name="anamnesis_vitae_unchanged" value={String(anamnesiVitaeUnchanged)} />
      
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

        {/* Complaints */}
        <ComplaintsField
          initialData={{
            complaints: visit?.complaints ? JSON.parse(visit.complaints) : [],
            other_complaints: visit?.other_complaints || '',
          }}
        />
        {state.errors?.complaints && (
          <div className="mt-2" aria-live="polite" aria-atomic="true">
            {state.errors.complaints.map((error: string) => (
              <p className="text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Anamnesis Vitae */}
        <div className="mt-6">
          <CollapsibleSection
            title="Анамнез життя"
            isOpen={anamnesiVitaeOpen}
            onToggle={() => setAnamnesiVitaeOpen((v) => !v)}
          >
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={anamnesiVitaeUnchanged}
                  onChange={(e) => setAnamnesiVitaeUnchanged(e.target.checked)}
                  disabled={isEditing}
                  className="mr-2 h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Анамнез життя без змін</span>
                {loadingAnamnesiVitae && <span className="ml-2 text-xs text-gray-500">(завантаження...)</span>}
              </label>
            </div>

            <div className="space-y-4">
              <AnamesisVitaeInfectionsField
                initialData={{
                  tuberculosis: (typeof anamnesiVitaeData?.tuberculosis === 'string' ? anamnesiVitaeData.tuberculosis : visit?.tuberculosis) || '',
                  hiv: (typeof anamnesiVitaeData?.hiv === 'string' ? anamnesiVitaeData.hiv : visit?.hiv) || '',
                  art: (typeof anamnesiVitaeData?.art === 'string' ? anamnesiVitaeData.art : visit?.art) || '',
                  hcv: (typeof anamnesiVitaeData?.hcv === 'string' ? anamnesiVitaeData.hcv : visit?.hcv) || '',
                  hcv_treatment: (typeof anamnesiVitaeData?.hcv_treatment === 'string' ? anamnesiVitaeData.hcv_treatment : visit?.hcv_treatment) || '',
                  hbv: (typeof anamnesiVitaeData?.hbv === 'string' ? anamnesiVitaeData.hbv : visit?.hbv) || '',
                  hbv_treatment: (typeof anamnesiVitaeData?.hbv_treatment === 'string' ? anamnesiVitaeData.hbv_treatment : visit?.hbv_treatment) || '',
                  other_infectious: (typeof anamnesiVitaeData?.other_infectious === 'string' ? anamnesiVitaeData.other_infectious : visit?.other_infectious) || '',
                }}
                disabled={anamnesiVitaeUnchanged}
              />

              <AnamesisVitaeOtherField
                initialData={{
                  surgeries: (typeof anamnesiVitaeData?.surgeries === 'string' ? anamnesiVitaeData.surgeries : visit?.surgeries) || '',
                  injuries: (typeof anamnesiVitaeData?.injuries === 'string' ? anamnesiVitaeData.injuries : visit?.injuries) || '',
                  allergies: (typeof anamnesiVitaeData?.allergies === 'string' ? anamnesiVitaeData.allergies : visit?.allergies) || '',
                  disability: (typeof anamnesiVitaeData?.disability === 'string' ? anamnesiVitaeData.disability : visit?.disability) || '',
                  other_diagnoses: (typeof anamnesiVitaeData?.other_diagnoses === 'string' ? anamnesiVitaeData.other_diagnoses : visit?.other_diagnoses) || '',
                  seizures: (typeof anamnesiVitaeData?.seizures === 'string' ? anamnesiVitaeData.seizures : visit?.seizures) || '',
                  seizures_start: (typeof anamnesiVitaeData?.seizures_start === 'string' ? anamnesiVitaeData.seizures_start : visit?.seizures_start) || '',
                  seizures_last: (typeof anamnesiVitaeData?.seizures_last === 'string' ? anamnesiVitaeData.seizures_last : visit?.seizures_last) || '',
                }}
                disabled={anamnesiVitaeUnchanged}
              />

              <AnamesisVitaeSubstanceField
                initialData={{
                  addiction_specialist: typeof anamnesiVitaeData?.addiction_specialist === 'boolean' ? anamnesiVitaeData.addiction_specialist : (visit?.addiction_specialist || false),
                  addiction_specialist_details: (typeof anamnesiVitaeData?.addiction_specialist_details === 'string' ? anamnesiVitaeData.addiction_specialist_details : visit?.addiction_specialist_details) || '',
                  alcohol_history: (typeof anamnesiVitaeData?.alcohol_history === 'string' ? anamnesiVitaeData.alcohol_history : visit?.alcohol_history) || '',
                  alcohol_duration: (typeof anamnesiVitaeData?.alcohol_duration === 'string' ? anamnesiVitaeData.alcohol_duration : visit?.alcohol_duration) || '',
                  drug_history: (typeof anamnesiVitaeData?.drug_history === 'string' ? anamnesiVitaeData.drug_history : visit?.drug_history) || '',
                  drug_start: (typeof anamnesiVitaeData?.drug_start === 'string' ? anamnesiVitaeData.drug_start : visit?.drug_start) || '',
                  drug_last: (typeof anamnesiVitaeData?.drug_last === 'string' ? anamnesiVitaeData.drug_last : visit?.drug_last) || '',
                  smoking_history: (typeof anamnesiVitaeData?.smoking_history === 'string' ? anamnesiVitaeData.smoking_history : visit?.smoking_history) || '',
                }}
                disabled={anamnesiVitaeUnchanged}
              />

              <AnamesisVitaeMentalField
                initialData={{
                  psychiatrist_care: typeof anamnesiVitaeData?.psychiatrist_care === 'boolean' ? anamnesiVitaeData.psychiatrist_care : (visit?.psychiatrist_care || false),
                  psychiatrist_details: (typeof anamnesiVitaeData?.psychiatrist_details === 'string' ? anamnesiVitaeData.psychiatrist_details : visit?.psychiatrist_details) || '',
                  family_psychiatric_history: (typeof anamnesiVitaeData?.family_psychiatric_history === 'string' ? anamnesiVitaeData.family_psychiatric_history : visit?.family_psychiatric_history) || '',
                  self_injurious: typeof anamnesiVitaeData?.self_injurious === 'boolean' ? anamnesiVitaeData.self_injurious : (visit?.self_injurious || false),
                  self_injurious_date: (typeof anamnesiVitaeData?.self_injurious_date === 'string' ? anamnesiVitaeData.self_injurious_date : visit?.self_injurious_date) || '',
                  self_injurious_cause: (typeof anamnesiVitaeData?.self_injurious_cause === 'string' ? anamnesiVitaeData.self_injurious_cause : visit?.self_injurious_cause) || '',
                }}
                disabled={anamnesiVitaeUnchanged}
              />
            </div>
          </CollapsibleSection>
        </div>

        {/* Anamnesis Morbi */}
        <div className="mt-6">
          <AnamnesisMorbiField
            initialData={{
              anamnesis_morbi: visit?.anamnesis_morbi || '',
              duration: visit?.duration || '',
            }}
          />
        </div>

        {/* Measurements */}
        <div className="mt-6">
          <MeasurementsField
            initialData={{
              systolic_blood_pressure: visit?.systolic_blood_pressure || '',
              diastolic_blood_pressure: visit?.diastolic_blood_pressure || '',
              heart_rate: visit?.heart_rate || '',
              temperature: visit?.temperature || '',
              respiratory_rate: visit?.respiratory_rate || '',
              height: visit?.height || '',
              weight: visit?.weight || '',
            }}
          />
        </div>

        {/* Об'єктивний огляд */}
        <div className="mt-6">
          <CollapsibleSection
            title="Об'єктивний огляд"
            isOpen={examinationsOpen}
            onToggle={() => setExaminationsOpen((v) => !v)}
          >
            <div className="space-y-4">
              <ExaminationsGeneralField
                initialData={{
                  general_condition: visit?.general_condition || '',
                  consciousness: visit?.consciousness || '',
                }}
              />

              <ExaminationsExternalField
                initialData={{
                  skin: visit?.skin || '',
                  mucous: visit?.mucous || '',
                  swelling: visit?.swelling || '',
                }}
              />

              <ExaminationsMusculoskeletalField
                initialData={{
                  musculoskeletal: visit?.musculoskeletal || '',
                }}
              />

              <ExaminationsRespiratoryField
                initialData={{
                  auscultation: visit?.auscultation || '',
                }}
              />

              <ExaminationsCardiovascularField
                initialData={{
                  auscultation_cardio: visit?.auscultation_cardio || '',
                  rhythm: visit?.rhythm || '',
                }}
              />

              <ExaminationsGastrointestinalField
                initialData={{
                  inspection: visit?.inspection || '',
                  palpation: visit?.palpation || '',
                  percussion: visit?.percussion || '',
                  blumberg: visit?.blumberg || false,
                  liver: visit?.liver || '',
                  spleen: visit?.spleen || '',
                  stool: visit?.stool || '',
                }}
              />

              <ExaminationsGenitourinaryField
                initialData={{
                  pasternatski: visit?.pasternatski || '',
                  urination: visit?.urination || '',
                }}
              />

              <ExaminationsMentalField
                initialData={{
                  rapport: visit?.rapport || '',
                  orientation: visit?.orientation || '',
                  delusions: visit?.delusions || '',
                  intellect: visit?.intellect || '',
                  perception: visit?.perception || '',
                  thought_process: visit?.thought_process || '',
                  memory: visit?.memory || '',
                }}
              />
            </div>
          </CollapsibleSection>
        </div>

        {/* Diagnosis */}
        <div className="mt-6 w-full">
          <DiagnosisField onChange={handleDiagnosisChange} />
        </div>

        {/* Consultations and Sick leave */}
        <div className="mt-6 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <CollapsibleSection
            title="Консультації"
            isOpen={consultationsOpen}
            onToggle={() => setConsultationsOpen((v) => !v)}
          >
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
                ))}              </div>
          </CollapsibleSection>

          {/* Sick leave / time off inputs (collapsible) */}
          <CollapsibleSection
            title="Звільнення від роботи"
            isOpen={sickLeaveOpen}
            onToggle={() => setSickLeaveOpen((v) => !v)}
          >
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
          </CollapsibleSection>
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