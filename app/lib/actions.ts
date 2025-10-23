'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
const CreateExamination = z.object({
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
});

const UpdateInvoice = z.object({
  customerId: z.string(),
  amount: z.any(),
  status: z.any(),
});

export type State = {
  errors?: {
    patientId?: string[];
    complaints?: string[];
  };
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

  // Build object for validation
  const toValidate = {
    patientId: formData.get('patientId'),
    complaints: complaintsParsed,
    blood_pressure: formData.get('blood_pressure') ?? undefined,
    heart_rate: formData.get('heart_rate') ?? undefined,
    temperature: formData.get('temperature') ?? undefined,
    examination: formData.get('examination') ?? undefined,
  };

  const validatedFields = CreateExamination.safeParse(toValidate);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Examination.',
    };
  }

  const { patientId, complaints, blood_pressure, heart_rate, temperature, examination } = validatedFields.data;

  // Store complaints as JSON text to simplify DB parameter typing
  const complaintsJson = JSON.stringify(complaints);

  try {
    await sql`
      INSERT INTO examinations (patient_id, complaints, blood_pressure, heart_rate, temperature, examination)
      VALUES (${patientId}, ${complaintsJson}, ${blood_pressure ?? null}, ${heart_rate ?? null}, ${temperature ?? null}, ${examination ?? null})
    `;
  } catch (err) {
    console.error('DB error creating examination:', err);
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