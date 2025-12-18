'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const SelectedDiagnosisSchema = z.object({
  id: z.preprocess((v) => (v === null || v === undefined ? null : Number(v)), z.number().nullable().optional()),
  code: z.string().optional(),
  label: z.string().optional(),
  note: z.preprocess((v) => (v === '' ? null : v), z.string().nullable().optional()),
});

const SelectedMedicationSchema = z.object({
  id: z.preprocess((v) => (v === null || v === undefined ? null : Number(v)), z.number().nullable().optional()),
  code: z.string().optional(),
  label: z.string().optional(),
  dose: z.preprocess((v) => (v === '' || v === null ? null : v), z.string().nullable().optional()),
  note: z.preprocess((v) => (v === '' || v === null ? null : v), z.string().nullable().optional()),
  frequencyPerDay: z.preprocess((v) => (v === null || v === undefined ? null : Number(v)), z.number().nullable().optional()),
  days: z.preprocess((v) => (v === null || v === undefined ? null : Number(v)), z.number().nullable().optional()),
  prescriptionNumber: z.preprocess((v) => (v === '' || v === null ? null : v), z.string().nullable().optional()),
});

const CreateExamination = z
  .object({
    patientId: z.string({
      invalid_type_error: 'Будь ласка, оберіть пацієнта.',
    }),
    complaints: z.array(z.string()).nonempty({
      message: "Потрібно вказати хоча б одну скаргу",
    }),
    systolic_blood_pressure: z.string().optional(),
    diastolic_blood_pressure: z.string().optional(),
    heart_rate: z.string().optional(),
    temperature: z.string().optional(),
    respiratory_rate: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
    examination: z.string().optional(),
    diagnoses: z.array(SelectedDiagnosisSchema).optional(),
    medications: z.array(SelectedMedicationSchema).optional(),
    consultations: z.array(z.string()).optional(),
    start_date: z.preprocess(
      (v) => {
        const s = v == null ? null : String(v).trim();
        return s === '' ? null : s;
      },
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    ),
    end_date: z.preprocess(
      (v) => {
        const s = v == null ? null : String(v).trim();
        return s === '' ? null : s;
      },
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    ),
  })
  .superRefine((data, ctx) => {
    const { start_date, end_date } = data as { start_date?: string | null; end_date?: string | null };
    if (start_date && end_date) {
      const s = new Date(start_date);
      const e = new Date(end_date);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid date format' });
      } else if (s > e) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'start_date must be before or equal to end_date' });
      }
    }
  });

const UpdateVisit = z.object({
  patientId: z.string(),
});

export type State = {
  errors?: Record<string, string[]>;
  message?: string | null;
};

export async function createExamination(prevState: State, formData: FormData) {
  // Parse complaints: frontend sends a single hidden input 'complaints' as JSON
  const rawComplaints = formData.get('complaints');
  let complaintsParsed: string[] = [];
  if (rawComplaints) {
    const asString = String(rawComplaints);
    try {
      const parsed = JSON.parse(asString);
      if (Array.isArray(parsed)) {
        complaintsParsed = parsed.map(String);
      } else if (typeof parsed === 'string') {
        complaintsParsed = [parsed];
      }
    } catch (e) {
      // fallback: treat as comma separated string
      console.warn('Failed to parse complaints JSON, falling back to CSV parse', e);
      complaintsParsed = asString.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  // parse diagnoses JSON (sent as hidden input 'diagnoses')
  const rawDiagnoses = formData.get('diagnoses');
  let diagnosesParsed: Array<{ id?: number | null; code?: string; label?: string; note?: string | null }> = [];
  if (rawDiagnoses) {
    const asString = String(rawDiagnoses);
    try {
      const parsed = JSON.parse(asString);
      if (Array.isArray(parsed)) {
        diagnosesParsed = parsed.map((p: Record<string, unknown>) => ({
          id: p?.id != null ? (typeof p.id === 'string' ? Number(p.id) : Number(p.id as unknown as number)) : null,
          code: p?.code != null ? String(p.code) : undefined,
          label: p?.label != null ? String(p.label) : undefined,
          note: p?.note != null ? String(p.note) : null,
        }));
      }
    } catch (e) {
      console.warn('Failed to parse diagnoses JSON', e);
      diagnosesParsed = [];
    }
  }

  // parse consultations JSON (sent as hidden input 'consultations')
  const rawConsultations = formData.get('consultations');
  let consultationsParsed: string[] = [];
  if (rawConsultations) {
    const asString = String(rawConsultations);
    try {
      const parsed = JSON.parse(asString);
      if (Array.isArray(parsed)) {
        consultationsParsed = parsed.map(String).filter(Boolean);
      }
    } catch (e) {
      console.warn('Failed to parse consultations JSON', e);
      consultationsParsed = [];
    }
  }

  // parse medications JSON (sent as hidden input 'medications')
  const rawMedications = formData.get('medications');
  let medicationsParsed: Array<{
    id?: number | null;
    code?: string;
    label?: string;
    dose?: string | null;
    note?: string | null;
    frequencyPerDay?: number | null;
    days?: number | null;
    prescriptionNumber?: string | null;
  }> = [];
  if (rawMedications) {
    const asString = String(rawMedications);
    try {
      const parsed = JSON.parse(asString);
      if (Array.isArray(parsed)) {
        medicationsParsed = parsed.map((p: Record<string, unknown>) => ({
          id: p?.id != null ? (typeof p.id === 'string' ? Number(p.id) : Number(p.id as unknown as number)) : null,
          code: p?.code != null ? String(p.code) : undefined,
          label: p?.label != null ? String(p.label) : undefined,
          dose: p?.dose != null ? String(p.dose) : null,
          note: p?.note != null ? String(p.note) : null,
          frequencyPerDay: p?.frequencyPerDay != null ? Number(p.frequencyPerDay) : null,
          days: p?.days != null ? Number(p.days) : null,
          prescriptionNumber: p?.prescriptionNumber != null ? String(p.prescriptionNumber) : null,
        }));
      }
    } catch (e) {
      console.warn('Failed to parse medications JSON', e);
      medicationsParsed = [];
    }
  }

  // parse sick leave dates (start_date, end_date)
  const rawStartDate = formData.get('start_date');
  const rawEndDate = formData.get('end_date');
  const startDate = rawStartDate ? String(rawStartDate).trim() : null;
  const endDate = rawEndDate ? String(rawEndDate).trim() : null;

  // Build object for validation
  const toValidate = {
    patientId: formData.get('patientId'),
    complaints: complaintsParsed,
    blood_pressure: formData.get('blood_pressure') ?? undefined,
    heart_rate: formData.get('heart_rate') ?? undefined,
    temperature: formData.get('temperature') ?? undefined,
    examination: formData.get('examination') ?? undefined,
    diagnoses: diagnosesParsed,
    medications: medicationsParsed,
    consultations: consultationsParsed,
    start_date: startDate,
    end_date: endDate,
  };

  const validatedFields = CreateExamination.safeParse(toValidate);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Examination.',
    };
  }

  const {
    patientId,
    complaints,
    tuberculosis,
    hiv,
    art,
    hcv,
    hcv_treatment,
    hbv,
    hbv_treatment,
    other_infectious,
    surgeries,
    injuries,
    allergies,
    disability,
    other_diagnoses,
    seizures,
    seizures_start,
    seizures_last,
    addiction_specialist,
    addiction_specialist_details,
    alcohol_history,
    alcohol_duration,
    drug_history,
    drug_start,
    drug_last,
    smoking_history,
    psychiatrist_care,
    psychiatrist_details,
    family_psychiatric_history,
    self_injurious,
    self_injurious_date,
    self_injurious_cause,
    anamnesis_morbi,
    duration,
    systolic_blood_pressure,
    diastolic_blood_pressure,
    heart_rate,
    temperature,
    respiratory_rate,
    saturation,
    height,
    weight,
    AS,
    AD,
    VOS,
    VOD,
    general_condition,
    consciousness,
    skin,
    mucous,
    swelling,
    musculoskeletal,
    auscultation,
    auscultation_cardio,
    rhythm,
    inspection,
    palpation,
    percussion,
    blumberg,
    liver,
    spleen,
    stool,
    pasternatski,
    urination,
    rapport,
    orientation,
    delusions,
    intellect,
    perception,
    thought_process,
    memory,
    examination,
    diagnoses,
    medications,
    consultations,
    start_date,
    end_date,
  } = validatedFields.data as {
    patientId: string;
    complaints: string[];
    tuberculosis?: string;
    hiv?: string;
    art?: string;
    hcv?: string;
    hcv_treatment?: string;
    hbv?: string;
    hbv_treatment?: string;
    other_infectious?: string;
    surgeries?: string;
    injuries?: string;
    allergies?: string;
    disability?: string;
    other_diagnoses?: string;
    seizures?: string;
    seizures_start?: string;
    seizures_last?: string;
    addiction_specialist?: boolean;
    addiction_specialist_details?: string;
    alcohol_history?: string;
    alcohol_duration?: string;
    drug_history?: string;
    drug_start?: string;
    drug_last?: string;
    smoking_history?: string;
    psychiatrist_care?: boolean;
    psychiatrist_details?: string;
    family_psychiatric_history?: string;
    self_injurious?: boolean;
    self_injurious_date?: string;
    self_injurious_cause?: string;
    anamnesis_morbi?: string;
    duration?: string;
    systolic_blood_pressure?: string;
    diastolic_blood_pressure?: string;
    heart_rate?: string;
    temperature?: string;
    respiratory_rate?: string;
    saturation?: string;
    height?: string;
    weight?: string;
    AS?: string;
    AD?: string;
    VOS?: string;
    VOD?: string;
    general_condition?: string;
    consciousness?: string;
    skin?: string;
    mucous?: string;
    swelling?: string;
    musculoskeletal?: string;
    auscultation?: string;
    auscultation_cardio?: string;
    rhythm?: string;
    inspection?: string;
    palpation?: string;
    percussion?: string;
    blumberg?: boolean;
    liver?: string;
    spleen?: string;
    stool?: string;
    pasternatski?: string;
    urination?: string;
    rapport?: string;
    orientation?: string;
    delusions?: string;
    intellect?: string;
    perception?: string;
    thought_process?: string;
    memory?: string;
    examination?: string;
    diagnoses?: Array<{ id?: number | null; code?: string; label?: string; note?: string | null }>;
    medications?: Array<{
      id?: number | null;
      code?: string;
      label?: string;
      dose?: string | null;
      note?: string | null;
      frequencyPerDay?: number | null;
      days?: number | null;
      prescriptionNumber?: string | null;
    }>;
    consultations?: string[];
    start_date?: string | null;
    end_date?: string | null;
  };

  // Get anamnesis_vitae_unchanged checkbox value
  const anamnesiVitaeUnchanged = formData.get('anamnesis_vitae_unchanged') === 'true';

  // Store complaints as JSON text to simplify DB parameter typing
  const complaintsJson = JSON.stringify(complaints);

  // determine current user (must be authenticated)
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // If we reached here without a user, return a controlled unauthorized response.
    // The page rendering is already protected server-side, so actions should normally
    // not see unauthenticated requests. We avoid redirect here to prevent NEXT_REDIRECT
    // from being thrown inside an action flow.
    return { message: 'Неавторизовано — увійдіть в систему для створення огляду.' };
  }

  const userId = user.id;
  
  // Get the default assignment_id for this user
  const { getDefaultAssignmentId } = await import('@/app/lib/data');
  const assignmentId = await getDefaultAssignmentId(userId);
  
  if (!assignmentId) {
    return { message: 'Користувач не має призначення. Зверніться до адміністратора.' };
  }

  try {
    // normalize numeric vitals: convert empty strings to null and parse numbers
    const systolicBP = typeof systolic_blood_pressure === 'string' && systolic_blood_pressure.trim() !== '' 
      ? Number(systolic_blood_pressure) : null;
    const diastolicBP = typeof diastolic_blood_pressure === 'string' && diastolic_blood_pressure.trim() !== '' 
      ? Number(diastolic_blood_pressure) : null;
    const hrVal = typeof heart_rate === 'string' && heart_rate.trim() !== '' ? Number(heart_rate) : null;
    const tempVal = typeof temperature === 'string' && temperature.trim() !== '' ? Number(temperature) : null;
    const respRate = typeof respiratory_rate === 'string' && respiratory_rate.trim() !== '' 
      ? Number(respiratory_rate) : null;
    const saturationVal = typeof saturation === 'string' && saturation.trim() !== '' ? Number(saturation) : null;
    const heightVal = typeof height === 'string' && height.trim() !== '' ? Number(height) : null;
    const weightVal = typeof weight === 'string' && weight.trim() !== '' ? Number(weight) : null;
    const asVal = typeof AS === 'string' && AS.trim() !== '' ? Number(AS) : null;
    const adVal = typeof AD === 'string' && AD.trim() !== '' ? Number(AD) : null;
    const vosVal = typeof VOS === 'string' && VOS.trim() !== '' ? Number(VOS) : null;
    const vodVal = typeof VOD === 'string' && VOD.trim() !== '' ? Number(VOD) : null;


    // perform both INSERTs inside a transaction to ensure atomicity
    // transient 'prepared statement does not exist' errors can occur; retry once if we see that
    const MAX_ATTEMPTS = 2;
    let attempt = 0;
    while (true) {
      try {
        await sql.begin(async (tx) => {
          const visitRows = await tx`
            INSERT INTO visits (patient_id, assignment_id)
            VALUES (${patientId}, ${assignmentId})
            RETURNING id
          `;
          const visitId = visitRows[0]?.id ?? null;

          if (!visitId) {
            throw new Error('Failed to create visit record');
          }

          await tx`
            INSERT INTO complaints (visit_id, complaints)
            VALUES (${visitId}, ${complaintsJson})
          `;

          // Insert anamnesis_vitae_general record with is_new flag
          await tx`
            INSERT INTO anamnesis_vitae_general (visit_id, is_new)
            VALUES (${visitId}, ${anamnesiVitaeUnchanged})
          `;

          // Only insert anamnesis vitae data if checkbox is NOT checked (is_new = false)
          if (!anamnesiVitaeUnchanged) {
            await tx`
              INSERT INTO anamnesis_vitae_infections (visit_id, tuberculosis, hiv, art, hcv, hcv_treatment, hbv, hbv_treatment, other_infectious)
              VALUES (${visitId}, ${tuberculosis ?? null}, ${hiv ?? null}, ${art ?? null}, ${hcv ?? null}, ${hcv_treatment ?? null}, ${hbv ?? null}, ${hbv_treatment ?? null}, ${other_infectious ?? null})
            `;

            await tx`
              INSERT INTO anamnesis_vitae_other (visit_id, surgeries, injuries, allergies, disability, other_diagnoses, seizures, seizures_start, seizures_last)
              VALUES (${visitId}, ${surgeries ?? null}, ${injuries ?? null}, ${allergies ?? null}, ${disability ?? null}, ${other_diagnoses ?? null}, ${seizures ?? null}, ${seizures_start ?? null}, ${seizures_last ?? null})
            `;

            await tx`
              INSERT INTO anamnesis_vitae_substance (visit_id, addiction_specialist, addiction_specialist_details, alcohol_history, alcohol_duration, drug_history, drug_start, drug_last, smoking_history)
              VALUES (${visitId}, ${addiction_specialist ?? null}, ${addiction_specialist_details ?? null}, ${alcohol_history ?? null}, ${alcohol_duration ?? null}, ${drug_history ?? null}, ${drug_start ?? null}, ${drug_last ?? null}, ${smoking_history ?? null})
            `;

            await tx`
              INSERT INTO anamnesis_vitae_mental (visits_id, psychiatrist_care, psychiatrist_details, family_psychiatric_history, self_injurious, self_injurious_date, self_injurious_cause)
              VALUES (${visitId}, ${psychiatrist_care ?? null}, ${psychiatrist_details ?? null}, ${family_psychiatric_history ?? null}, ${self_injurious ?? null}, ${self_injurious_date ?? null}, ${self_injurious_cause ?? null})
            `;
          }

          await tx`
            INSERT INTO anamnesis_morbi (visit_id, anamnesis_morbi, duration)
            VALUES (${visitId}, ${anamnesis_morbi ?? null}, ${duration ?? null})
          `;

          await tx`
            INSERT INTO examinations_general (visit_id, general_condition, consciousness)
            VALUES (${visitId}, ${general_condition ?? null}, ${consciousness ?? null})
          `;

          await tx`
            INSERT INTO examinations_external (visit_id, skin, mucous, swelling)
            VALUES (${visitId}, ${skin ?? null}, ${mucous ?? null}, ${swelling ?? null})
          `;

          await tx`
            INSERT INTO examinations_musculoskeletal (visit_id, musculoskeletal)
            VALUES (${visitId}, ${musculoskeletal ?? null})
          `;

          await tx`
            INSERT INTO examinations_respiratory (visit_id, auscultation)
            VALUES (${visitId}, ${auscultation ?? null})
          `;

          await tx`
            INSERT INTO examinations_cardiovascular (visit_id, auscultation, rhythm)
            VALUES (${visitId}, ${auscultation_cardio ?? null}, ${rhythm ?? null})
          `;

          await tx`
            INSERT INTO examinations_gastrointestinal (visit_id, inspection, palpation, percussion, blumberg, liver, spleen, stool)
            VALUES (${visitId}, ${inspection ?? null}, ${palpation ?? null}, ${percussion ?? null}, ${blumberg ?? false}, ${liver ?? null}, ${spleen ?? null}, ${stool ?? null})
          `;

          await tx`
            INSERT INTO examinations_genitourinary (visit_id, pasternatski, urination)
            VALUES (${visitId}, ${pasternatski ?? null}, ${urination ?? null})
          `;

          await tx`
            INSERT INTO examinations_mental (visit_id, rapport, orientation, delusions, intellect, perception, thought_process, memory)
            VALUES (${visitId}, ${rapport ?? null}, ${orientation ?? null}, ${delusions ?? null}, ${intellect ?? null}, ${perception ?? null}, ${thought_process ?? null}, ${memory ?? null})
          `;

          await tx`
            INSERT INTO measurements (visit_id, systolic_blood_pressure, diastolic_blood_pressure, heart_rate, temperature, respiratory_rate, saturation, height, weight, "AS", "AD", "VOS", "VOD")
            VALUES (${visitId}, ${systolicBP ?? null}, ${diastolicBP ?? null}, ${hrVal ?? null}, ${tempVal ?? null}, ${respRate ?? null}, ${saturationVal ?? null}, ${heightVal ?? null}, ${weightVal ?? null}, ${asVal ?? null}, ${adVal ?? null}, ${vosVal ?? null}, ${vodVal ?? null})
          `;

          // insert diagnoses (if any) for this visit
          if (diagnoses && diagnoses.length > 0) {
            for (const d of diagnoses) {
              // diagnosis_id column is int8 in your DB; d.id may be null for free-text/common picks
              await tx`
                INSERT INTO diagnosis (visit_id, diagnosis_id, note)
                VALUES (${visitId}, ${d.id ?? null}, ${d.note ?? null})
              `;
            }
          }

          // insert consultations (if any) for this visit
          if (consultations && consultations.length > 0) {
            for (const c of consultations) {
              await tx`
                INSERT INTO consultations (consultations, visit_id)
                VALUES (${c}, ${visitId})
              `;
            }
          }

          // insert sick_leave record if any date provided
          if (start_date || end_date) {
            await tx`
              INSERT INTO sick_leave (visit_id, start_date, end_date)
              VALUES (${visitId}, ${start_date ?? null}, ${end_date ?? null})
            `;
          }

          // insert drug administrations (medications) for this visit
          if (medications && medications.length > 0) {
            for (const m of medications) {
              // Parse dose as real number if provided
              let doseValue: number | null = null;
              if (m.dose) {
                const parsed = parseFloat(m.dose);
                if (!isNaN(parsed)) {
                  doseValue = parsed;
                }
              }

              await tx`
                INSERT INTO pharmacy.administrations (drug_id, visit_id, prescription_id, dose, frequency_per_day, duration_days, assignment_id)
                VALUES (${m.id ?? null}, ${visitId}, ${m.prescriptionNumber ?? null}, ${doseValue}, ${m.frequencyPerDay ?? null}, ${m.days ?? null}, ${assignmentId})
              `;
            }
          }
        });
        break; // success
      } catch (err) {
        // If a NEXT_REDIRECT was thrown, rethrow so Next handles the redirect
        if ((err as unknown as { digest?: string })?.digest?.startsWith?.('NEXT_REDIRECT')) {
          throw err;
        }

        const e = err as Record<string, unknown>;
        const code = (e?.code as string | undefined) ?? (e?.severity as string | undefined);
        const msg = String((e?.message as string | undefined) ?? err);

        // Handle duplicate key error for visits table - try to fix sequence
        const isDuplicateKeyError = code === '23505' &&
          (msg.includes('visits_pkey') || msg.includes('duplicate key value violates unique constraint'));

        // Handle transient prepared-statement error
        const isPreparedStmtError = code === '26000' || /prepared statement .* does not exist/i.test(msg);

        attempt++;

        if (isDuplicateKeyError && attempt < MAX_ATTEMPTS) {
          console.warn('Duplicate key error on visits table, attempting to fix sequence (attempt', attempt + 1, ')', err);
          try {
            // Try to fix the sequence
            const maxIdResult = await sql`SELECT COALESCE(MAX(id), 0) as max_id FROM visits`;
            const maxId = maxIdResult[0]?.max_id || 0;
            await sql`SELECT setval(pg_get_serial_sequence('visits', 'id'), ${maxId + 1}, false)`;
            console.warn('Sequence fixed, retrying transaction');
            await new Promise((r) => setTimeout(r, 150));
            continue;
          } catch (seqErr) {
            console.error('Failed to fix sequence:', seqErr);
            throw err; // throw original error if sequence fix fails
          }
        }

        if (isPreparedStmtError && attempt < MAX_ATTEMPTS) {
          console.warn('Transient prepared-statement error, retrying transaction (attempt', attempt + 1, ')', err);
          await new Promise((r) => setTimeout(r, 150));
          continue;
        }

        throw err;
      }
    }
  } catch (err) {
    // If a NEXT_REDIRECT was thrown, rethrow so Next handles the redirect
    if ((err as unknown as { digest?: string })?.digest?.startsWith?.('NEXT_REDIRECT')) {
      throw err;
    }

    console.error('DB error creating examination or visit:', err);
    return {
      message: 'Database Error: Failed to Create Examination.',
    };
  }

  revalidatePath('/dashboard/visits');
  redirect('/dashboard/visits');
}

export async function updateVisit(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateVisit.safeParse({
    patientId: formData.get('patientId'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Visit.',
    };
  }

  const { patientId } = validatedFields.data;

  // Get current user
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { message: 'Неавторизовано — увійдіть в систему для оновлення огляду.' };
  }

  const userId = user.id;
  
  // Get the default assignment_id for this user
  const { getDefaultAssignmentId } = await import('@/app/lib/data');
  const assignmentId = await getDefaultAssignmentId(userId);
  
  if (!assignmentId) {
    return { message: 'Користувач не має призначення. Зверніться до адміністратора.' };
  }

  // Extract medical data from form
  const complaints = formData.get('complaints') as string || '';
  const tuberculosis = formData.get('tuberculosis') as string || '';
  const hiv = formData.get('hiv') as string || '';
  const art = formData.get('art') as string || '';
  const hcv = formData.get('hcv') as string || '';
  const hcvTreatment = formData.get('hcv_treatment') as string || '';
  const hbv = formData.get('hbv') as string || '';
  const hbvTreatment = formData.get('hbv_treatment') as string || '';
  const otherInfectious = formData.get('other_infectious') as string || '';
  const surgeries = formData.get('surgeries') as string || '';
  const injuries = formData.get('injuries') as string || '';
  const allergies = formData.get('allergies') as string || '';
  const disability = formData.get('disability') as string || '';
  const otherDiagnoses = formData.get('other_diagnoses') as string || '';
  const seizures = formData.get('seizures') as string || '';
  const seizuresStart = formData.get('seizures_start') as string || '';
  const seizuresLast = formData.get('seizures_last') as string || '';
  const addictionSpecialist = formData.get('addiction_specialist') === 'true';
  const addictionSpecialistDetails = formData.get('addiction_specialist_details') as string || '';
  const alcoholHistory = formData.get('alcohol_history') as string || '';
  const alcoholDuration = formData.get('alcohol_duration') as string || '';
  const drugHistory = formData.get('drug_history') as string || '';
  const drugStart = formData.get('drug_start') as string || '';
  const drugLast = formData.get('drug_last') as string || '';
  const smokingHistory = formData.get('smoking_history') as string || '';
  const psychiatristCare = formData.get('psychiatrist_care') === 'true';
  const psychiatristDetails = formData.get('psychiatrist_details') as string || '';
  const familyPsychiatricHistory = formData.get('family_psychiatric_history') as string || '';
  const selfInjurious = formData.get('self_injurious') === 'true';
  const selfInjuriousDate = formData.get('self_injurious_date') as string || '';
  const selfInjuriousCause = formData.get('self_injurious_cause') as string || '';
  const anamnesisMorbi = formData.get('anamnesis_morbi') as string || '';
  const duration = formData.get('duration') as string || '';
  const systolicBP = formData.get('systolic_blood_pressure') as string || '';
  const diastolicBP = formData.get('diastolic_blood_pressure') as string || '';
  const heartRate = formData.get('heart_rate') as string || '';
  const temperature = formData.get('temperature') as string || '';
  const respiratoryRate = formData.get('respiratory_rate') as string || '';
  const saturation = formData.get('saturation') as string || '';
  const height = formData.get('height') as string || '';
  const weight = formData.get('weight') as string || '';
  const AS = formData.get('AS') as string || '';
  const AD = formData.get('AD') as string || '';
  const VOS = formData.get('VOS') as string || '';
  const VOD = formData.get('VOD') as string || '';
  const generalCondition = formData.get('general_condition') as string || '';
  const consciousness = formData.get('consciousness') as string || '';
  const skin = formData.get('skin') as string || '';
  const mucous = formData.get('mucous') as string || '';
  const swelling = formData.get('swelling') as string || '';
  const musculoskeletal = formData.get('musculoskeletal') as string || '';
  const auscultation = formData.get('auscultation') as string || '';
  const auscultationCardio = formData.get('auscultation_cardio') as string || '';
  const rhythm = formData.get('rhythm') as string || '';
  const inspection = formData.get('inspection') as string || '';
  const palpation = formData.get('palpation') as string || '';
  const percussion = formData.get('percussion') as string || '';
  const blumberg = formData.get('blumberg') === 'true';
  const rapport = formData.get('rapport') as string || '';
  const orientation = formData.get('orientation') as string || '';
  const delusions = formData.get('delusions') as string || '';
  const intellect = formData.get('intellect') as string || '';
  const perception = formData.get('perception') as string || '';
  const thoughtProcess = formData.get('thought_process') as string || '';
  const memory = formData.get('memory') as string || '';
  const liver = formData.get('liver') as string || '';
  const spleen = formData.get('spleen') as string || '';
  const stool = formData.get('stool') as string || '';
  const pasternatski = formData.get('pasternatski') as string || '';
  const urination = formData.get('urination') as string || '';
  const examination = formData.get('examination') as string || '';
  const diagnoses = formData.get('diagnoses') as string || '[]';
  const medications = formData.get('medications') as string || '[]';
  const consultations = formData.get('consultations') as string || '[]';
  const sickLeaveFrom = formData.get('sick_leave_from') as string || null;
  const sickLeaveTo = formData.get('sick_leave_to') as string || null;
  const anamnesiVitaeUnchanged = formData.get('anamnesis_vitae_unchanged') === 'true';

  try {
    // Update main visit record
    await sql`
      UPDATE visits
      SET patient_id = ${patientId}
      WHERE id = ${id}
    `;

    // Update or insert complaints - delete existing first
    await sql`DELETE FROM complaints WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO complaints (visit_id, complaints)
      VALUES (${id}, ${complaints})
    `;

    // Update or insert anamnesis_vitae_general
    await sql`DELETE FROM anamnesis_vitae_general WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO anamnesis_vitae_general (visit_id, is_new)
      VALUES (${id}, ${anamnesiVitaeUnchanged})
    `;

    // Only update anamnesis vitae data if checkbox is NOT checked (is_new = false)
    if (!anamnesiVitaeUnchanged) {
      // Update or insert infectious diseases - delete existing first
      await sql`DELETE FROM anamnesis_vitae_infections WHERE visit_id = ${id}`;
      await sql`
        INSERT INTO anamnesis_vitae_infections (visit_id, tuberculosis, hiv, art, hcv, hcv_treatment, hbv, hbv_treatment, other_infectious)
        VALUES (${id}, ${tuberculosis}, ${hiv}, ${art}, ${hcv}, ${hcvTreatment}, ${hbv}, ${hbvTreatment}, ${otherInfectious})
      `;

      // Update or insert anamnesis vitae other - delete existing first
      await sql`DELETE FROM anamnesis_vitae_other WHERE visit_id = ${id}`;
      await sql`
        INSERT INTO anamnesis_vitae_other (visit_id, surgeries, injuries, allergies, disability, other_diagnoses, seizures, seizures_start, seizures_last)
        VALUES (${id}, ${surgeries}, ${injuries}, ${allergies}, ${disability}, ${otherDiagnoses}, ${seizures}, ${seizuresStart}, ${seizuresLast})
      `;

      // Update or insert substance abuse history - delete existing first
      await sql`DELETE FROM anamnesis_vitae_substance WHERE visit_id = ${id}`;
      await sql`
        INSERT INTO anamnesis_vitae_substance (visit_id, addiction_specialist, addiction_specialist_details, alcohol_history, alcohol_duration, drug_history, drug_start, drug_last, smoking_history)
        VALUES (${id}, ${addictionSpecialist}, ${addictionSpecialistDetails}, ${alcoholHistory}, ${alcoholDuration}, ${drugHistory}, ${drugStart}, ${drugLast}, ${smokingHistory})
      `;

      // Update or insert psychiatric history - delete existing first
      await sql`DELETE FROM anamnesis_vitae_mental WHERE visits_id = ${id}`;
      await sql`
        INSERT INTO anamnesis_vitae_mental (visits_id, psychiatrist_care, psychiatrist_details, family_psychiatric_history, self_injurious, self_injurious_date, self_injurious_cause)
        VALUES (${id}, ${psychiatristCare}, ${psychiatristDetails}, ${familyPsychiatricHistory}, ${selfInjurious}, ${selfInjuriousDate}, ${selfInjuriousCause})
      `;
    } else {
      // If checkbox is checked, delete all anamnesis vitae data
      await sql`DELETE FROM anamnesis_vitae_infections WHERE visit_id = ${id}`;
      await sql`DELETE FROM anamnesis_vitae_other WHERE visit_id = ${id}`;
      await sql`DELETE FROM anamnesis_vitae_substance WHERE visit_id = ${id}`;
      await sql`DELETE FROM anamnesis_vitae_mental WHERE visits_id = ${id}`;
    }

    // Update or insert anamnesis_morbi - delete existing first
    await sql`DELETE FROM anamnesis_morbi WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO anamnesis_morbi (visit_id, anamnesis_morbi, duration)
      VALUES (${id}, ${anamnesisMorbi}, ${duration})
    `;

    // Update or insert examinations_general - delete existing first
    await sql`DELETE FROM examinations_general WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO examinations_general (visit_id, general_condition, consciousness)
      VALUES (${id}, ${generalCondition}, ${consciousness})
    `;

    // Update or insert examinations_external - delete existing first
    await sql`DELETE FROM examinations_external WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO examinations_external (visit_id, skin, mucous, swelling)
      VALUES (${id}, ${skin}, ${mucous}, ${swelling})
    `;

    // Update or insert examinations_musculoskeletal - delete existing first
    await sql`DELETE FROM examinations_musculoskeletal WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO examinations_musculoskeletal (visit_id, musculoskeletal)
      VALUES (${id}, ${musculoskeletal})
    `;

    // Update or insert examinations_respiratory - delete existing first
    await sql`DELETE FROM examinations_respiratory WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO examinations_respiratory (visit_id, auscultation)
      VALUES (${id}, ${auscultation})
    `;

    // Update or insert examinations_cardiovascular - delete existing first
    await sql`DELETE FROM examinations_cardiovascular WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO examinations_cardiovascular (visit_id, auscultation, rhythm)
      VALUES (${id}, ${auscultationCardio}, ${rhythm})
    `;

    // Update or insert examinations_gastrointestinal - delete existing first
    await sql`DELETE FROM examinations_gastrointestinal WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO examinations_gastrointestinal (visit_id, inspection, palpation, percussion, blumberg, liver, spleen, stool)
      VALUES (${id}, ${inspection}, ${palpation}, ${percussion}, ${blumberg}, ${liver}, ${spleen}, ${stool})
    `;

    // Update or insert examinations_mental - delete existing first
    await sql`DELETE FROM examinations_mental WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO examinations_mental (visit_id, rapport, orientation, delusions, intellect, perception, thought_process, memory)
      VALUES (${id}, ${rapport}, ${orientation}, ${delusions}, ${intellect}, ${perception}, ${thoughtProcess}, ${memory})
    `;

    // Update or insert examinations_genitourinary - delete existing first
    await sql`DELETE FROM examinations_genitourinary WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO examinations_genitourinary (visit_id, pasternatski, urination)
      VALUES (${id}, ${pasternatski}, ${urination})
    `;

    // Update or insert measurements - delete existing first
    await sql`DELETE FROM measurements WHERE visit_id = ${id}`;
    await sql`
      INSERT INTO measurements (visit_id, systolic_blood_pressure, diastolic_blood_pressure, heart_rate, temperature, respiratory_rate, saturation, height, weight, "AS", "AD", "VOS", "VOD")
      VALUES (
        ${id},
        ${systolicBP ? parseInt(systolicBP) : null}, 
        ${diastolicBP ? parseInt(diastolicBP) : null}, 
        ${heartRate ? parseInt(heartRate) : null}, 
        ${temperature ? parseFloat(temperature) : null}, 
        ${respiratoryRate ? parseInt(respiratoryRate) : null},
        ${saturation ? parseFloat(saturation) : null},
        ${height ? parseFloat(height) : null},
        ${weight ? parseFloat(weight) : null},
        ${AS ? parseInt(AS) : null},
        ${AD ? parseInt(AD) : null},
        ${VOS ? parseFloat(VOS) : null},
        ${VOD ? parseFloat(VOD) : null}
      )
    `;

    // Update sick leave if provided
    if (sickLeaveFrom || sickLeaveTo) {
      await sql`
        INSERT INTO sick_leave (visit_id, start_date, end_date)
        VALUES (${id}, ${sickLeaveFrom}, ${sickLeaveTo})
        ON CONFLICT (visit_id)
        DO UPDATE SET 
          start_date = ${sickLeaveFrom},
          end_date = ${sickLeaveTo}
      `;
    }

    // Handle consultations - delete existing and insert new
    await sql`DELETE FROM consultations WHERE visit_id = ${id}`;
    if (consultations && consultations !== '[]') {
      const consultationsList = JSON.parse(consultations);
      for (const consultation of consultationsList) {
        await sql`
          INSERT INTO consultations (visit_id, consultations)
          VALUES (${id}, ${consultation})
        `;
      }
    }

    // Handle diagnoses - delete existing and insert new
    await sql`DELETE FROM diagnosis WHERE visit_id = ${id}`;
    if (diagnoses && diagnoses !== '[]') {
      const diagnosisList = JSON.parse(diagnoses);
      for (const diag of diagnosisList) {
        await sql`
          INSERT INTO diagnosis (visit_id, diagnosis_id, note)
          VALUES (${id}, ${diag.id}, ${diag.note || null})
        `;
      }
    }

    // Handle medications/drug administrations - delete existing and insert new
    await sql`DELETE FROM pharmacy.administrations WHERE visit_id = ${id}`;
    if (medications && medications !== '[]') {
      const medicationsList = JSON.parse(medications);
      for (const med of medicationsList) {
        await sql`
          INSERT INTO pharmacy.administrations (visit_id, drug_id, dose, frequency_per_day, duration_days, assignment_id)
          VALUES (${id}, ${med.id}, ${med.dose || null}, ${med.frequencyPerDay || null}, ${med.days || null}, ${assignmentId})
        `;
      }
    }

  } catch (error) {
    console.error('Database Error:', error);
    return { message: 'Database Error: Failed to Update Visit.' };
  }

  revalidatePath('/dashboard/visits');
  redirect('/dashboard/visits');
}

export async function deleteVisit(id: string) {
  try {
    // Delete all related records first (due to foreign key constraints)
    await sql`DELETE FROM pharmacy.administrations WHERE id_visit = ${id}`;
    await sql`DELETE FROM diagnosis WHERE visit_id = ${id}`;
    await sql`DELETE FROM consultations WHERE visit_id = ${id}`;
    await sql`DELETE FROM examinations WHERE visit_id = ${id}`;
    await sql`DELETE FROM sick_leave WHERE visit_id = ${id}`;

    // Finally delete the visit itself
    await sql`DELETE FROM visits WHERE id = ${id}`;

    revalidatePath('/dashboard/visits');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to Delete Visit');
  }
}

// Authentication is now handled by Supabase Auth
// No longer need this function - authentication happens client-side

export async function createInvoice(
  prevState: State,
  formData: FormData,
) {
  const validatedFields = CreateInvoice.safeParse({
    name: formData.get('name'),
    date: formData.get('date'),
    from_user_id: formData.get('from_user_id'),
    to_user_id: formData.get('to_user_id'),
    from_local_assignment_id: formData.get('from_local_assignment_id'),
    to_local_assignment_id: formData.get('to_local_assignment_id'),
    notes: formData.get('notes'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { name, date, from_user_id, to_user_id, from_local_assignment_id, to_local_assignment_id, notes } = validatedFields.data;

  // Parse medications if provided
  let medications = [];
  const medicationsData = formData.get('medications');
  if (medicationsData && typeof medicationsData === 'string') {
    try {
      medications = JSON.parse(medicationsData);
    } catch (error) {
      console.error('Error parsing medications:', error);
    }
  }

  let invoiceId;
  try {
    const result = await sql`
      INSERT INTO pharmacy.invoices (name, date, from_user_id, to_user_id, from_local_assignment_id, to_local_assignment_id, notes)
      VALUES (
        ${name},
        ${date || null},
        ${from_user_id || null},
        ${to_user_id || null},
        ${from_local_assignment_id || null},
        ${to_local_assignment_id || null},
        ${notes || null}
      )
      RETURNING id
    `;

    invoiceId = result[0].id;

    // Insert medications if any
    if (medications.length > 0) {
      for (const med of medications) {
        // Check available stock before inserting transfer
        if (from_local_assignment_id) {
          const stock = await sql`
            SELECT quantity
            FROM pharmacy.stock
            WHERE id = ${med.drug_id} AND assignment_id = ${from_local_assignment_id}
          `;

          const availableQuantity = stock && stock.length > 0 ? Number(stock[0].quantity) : 0;

          if (availableQuantity < med.quantity) {
            // Get drug name for error message
            const drugInfo = await sql`
              SELECT full_drug_name FROM pharmacy.base WHERE id = ${med.drug_id}
            `;
            const drugName = drugInfo && drugInfo.length > 0 ? drugInfo[0].full_drug_name : 'невідомий препарат';
            
            return {
              message: `Недостатньо залишків: ${drugName}. Доступно: ${availableQuantity}, запитано: ${med.quantity}`,
            };
          }
        }

        await sql`
          INSERT INTO pharmacy.transfer (invoice_id, drug_id, quantity)
          VALUES (${invoiceId}, ${med.drug_id}, ${med.quantity})
        `;
      }
    }
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/pharmacy');
  redirect(`/dashboard/pharmacy/invoices/${invoiceId}/edit`);
}

const CreateInvoice = z.object({
  name: z.string().min(1, 'Назва накладної є обов\'язковою'),
  date: z.string().optional(),
  from_user_id: z.string().optional(),
  to_user_id: z.string().optional(),
  from_local_assignment_id: z.coerce.number().optional(),
  to_local_assignment_id: z.coerce.number().optional(),
  notes: z.string().optional(),
});

const UpdateInvoice = z.object({
  name: z.string().min(1, 'Назва накладної є обов\'язковою'),
  date: z.string().optional(),
  from_user_id: z.string().optional(),
  to_user_id: z.string().optional(),
  from_local_assignment_id: z.coerce.number().optional(),
  to_local_assignment_id: z.coerce.number().optional(),
  notes: z.string().optional(),
}); export async function updateInvoice(
  id: number,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    name: formData.get('name'),
    date: formData.get('date'),
    from_user_id: formData.get('from_user_id'),
    to_user_id: formData.get('to_user_id'),
    from_local_assignment_id: formData.get('from_local_assignment_id'),
    to_local_assignment_id: formData.get('to_local_assignment_id'),
    notes: formData.get('notes'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { name, date, from_user_id, to_user_id, from_local_assignment_id, to_local_assignment_id, notes } = validatedFields.data;

  try {
    await sql`
      UPDATE pharmacy.invoices
      SET 
        name = ${name},
        date = ${date || null},
        from_user_id = ${from_user_id || null},
        to_user_id = ${to_user_id || null},
        from_local_assignment_id = ${from_local_assignment_id || null},
        to_local_assignment_id = ${to_local_assignment_id || null},
        notes = ${notes || null}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Database Error:', error);
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  revalidatePath('/dashboard/pharmacy');
  redirect('/dashboard/pharmacy?tab=invoices');
}

export async function deleteInvoice(id: number) {
  try {
    await sql`DELETE FROM pharmacy.invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/pharmacy');
    redirect('/dashboard/pharmacy?tab=invoices');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to Delete Invoice');
  }
}