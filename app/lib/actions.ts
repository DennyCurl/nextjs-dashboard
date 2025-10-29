'use server';

import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
// authConfig is used by auth middleware in other modules; not required here
import { redirect } from 'next/navigation';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
const SelectedDiagnosisSchema = z.object({
  id: z.preprocess((v) => (v === null || v === undefined ? null : Number(v)), z.number().nullable().optional()),
  code: z.string().optional(),
  label: z.string().optional(),
  note: z.preprocess((v) => (v === '' ? null : v), z.string().nullable().optional()),
});

const CreateExamination = z
  .object({
    patientId: z.string({
      invalid_type_error: 'Будь ласка, оберіть пацієнта.',
    }),
    complaints: z.array(z.string()).nonempty({
      message: "Потрібно вказати хоча б одну скаргу",
    }),
    blood_pressure: z.string().optional(),
    heart_rate: z.string().optional(),
    temperature: z.string().optional(),
    examination: z.string().optional(),
    diagnoses: z.array(SelectedDiagnosisSchema).optional(),
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

const UpdateInvoice = z.object({
  customerId: z.string(),
  amount: z.any(),
  status: z.any(),
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
    blood_pressure,
    heart_rate,
    temperature,
    examination,
    diagnoses,
    consultations,
    start_date,
    end_date,
  } = validatedFields.data as {
    patientId: string;
    complaints: string[];
    blood_pressure?: string;
    heart_rate?: string;
    temperature?: string;
    examination?: string;
    diagnoses?: Array<{ id?: number | null; code?: string; label?: string; note?: string | null }>;
    consultations?: string[];
    start_date?: string | null;
    end_date?: string | null;
  };

  // Store complaints as JSON text to simplify DB parameter typing
  const complaintsJson = JSON.stringify(complaints);

  // determine current user (must be authenticated)
  // Use the `auth` handler exported from our `auth.ts` to get the current session
  // `auth()` when invoked server-side will read headers() and return the auth object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (auth as any)();
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id ?? null;

  if (!userId) {
    // If we reached here without a user, return a controlled unauthorized response.
    // The page rendering is already protected server-side, so actions should normally
    // not see unauthenticated requests. We avoid redirect here to prevent NEXT_REDIRECT
    // from being thrown inside an action flow.
    return { message: 'Неавторизовано — увійдіть в систему для створення огляду.' };
  }

  try {
    // normalize numeric vitals: convert empty strings to null and parse numbers
    const bpVal = typeof blood_pressure === 'string' && blood_pressure.trim() !== '' ? Number(blood_pressure) : null;
    const hrVal = typeof heart_rate === 'string' && heart_rate.trim() !== '' ? Number(heart_rate) : null;
    const tempVal = typeof temperature === 'string' && temperature.trim() !== '' ? Number(temperature) : null;


    // perform both INSERTs inside a transaction to ensure atomicity
    // transient 'prepared statement does not exist' errors can occur; retry once if we see that
    const MAX_ATTEMPTS = 2;
    let attempt = 0;
    while (true) {
      try {
        await sql.begin(async (tx) => {
          const visitRows = await tx`
            INSERT INTO visits (patient_id, user_id)
            VALUES (${patientId}, ${userId})
            RETURNING id
          `;
          const visitId = visitRows[0]?.id ?? null;

          if (!visitId) {
            throw new Error('Failed to create visit record');
          }

          await tx`
            INSERT INTO examinations (visit_id, complaints, blood_pressure, heart_rate, temperature, examination)
            VALUES (${visitId}, ${complaintsJson}, ${bpVal ?? null}, ${hrVal ?? null}, ${tempVal ?? null}, ${examination ?? null})
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
        });
        break; // success
      } catch (err) {
        // If a NEXT_REDIRECT was thrown, rethrow so Next handles the redirect
        if ((err as unknown as { digest?: string })?.digest?.startsWith?.('NEXT_REDIRECT')) {
          throw err;
        }

        // If this is a transient prepared-statement error, retry once
  const e = err as Record<string, unknown>;
  const code = (e?.code as string | undefined) ?? (e?.severity as string | undefined);
  const msg = String((e?.message as string | undefined) ?? err);
        const isPreparedStmtError = code === '26000' || /prepared statement .* does not exist/i.test(msg);
        attempt++;
        if (isPreparedStmtError && attempt < MAX_ATTEMPTS) {
          console.warn('Transient prepared-statement error, retrying transaction (attempt', attempt + 1, ')', err);
          // small delay before retrying
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

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
 
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
 
  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');

  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // Call the signIn helper (server-side). The login form is now handled
    // client-side so this server action is not used by the login page, but
    // keep the original behavior for other callers.
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}