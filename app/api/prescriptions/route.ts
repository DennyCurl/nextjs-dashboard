import postgres from 'postgres';
import type { NextRequest } from 'next/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

type PresRow = {
  id: number;
  medication_id: number | null;
  dose: number | null;
  frequency_per_day: number | null;
  duration_days: number | null;
  prescription_number: string | null;
  start_date: string | null;
  created_at: string;
  full_drug_name?: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const patientIdStr = req.nextUrl.searchParams.get('patientId');
    if (!patientIdStr) return new Response(JSON.stringify([]), { status: 200 });
    const patientId = Number(patientIdStr);
    if (!Number.isFinite(patientId)) return new Response(JSON.stringify([]), { status: 200 });

    const rows = (await sql`
      SELECT p.id, p.medication_id, p.dose, p.frequency_per_day, p.duration_days, p.prescription_number, p.start_date, p.created_at,
             db.full_drug_name
      FROM "prescriptions" p
      LEFT JOIN "drugBase" db ON db.id = p.medication_id
      WHERE p.patient_id = ${patientId}
      ORDER BY p.created_at DESC
    `) as PresRow[];

    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (err) {
    console.error('Failed to load prescriptions for patient:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
