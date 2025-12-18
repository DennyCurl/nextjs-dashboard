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
  available_quantity?: number | null;
  unit?: string | null;
  // Нові поля для обліку виданих медикаментів
  total_dispensed_days?: number | null;
  remaining_days?: number | null;
};

export async function GET(req: NextRequest) {
  try {
    const patientIdStr = req.nextUrl.searchParams.get('patientId');
    if (!patientIdStr) return new Response(JSON.stringify([]), { status: 200 });
    const patientId = Number(patientIdStr);
    if (!Number.isFinite(patientId)) return new Response(JSON.stringify([]), { status: 200 });

    const rows = (await sql`
      SELECT 
        p.id, 
        p.medication_id, 
        p.dose, 
        p.frequency_per_day, 
        p.duration_days, 
        p.prescription_number, 
        p.start_date, 
        p.created_at,
        db.full_drug_name, 
        db.unit, 
        am.quantity AS available_quantity,
        -- Розрахунок суми вже виданих днів для цього призначення
        COALESCE(SUM(da.duration_days), 0) AS total_dispensed_days,
        -- Розрахунок днів що залишились
        GREATEST(0, p.duration_days - COALESCE(SUM(da.duration_days), 0)) AS remaining_days
      FROM "prescriptions" p
      LEFT JOIN pharmacy.base db ON db.id = p.medication_id
      LEFT JOIN pharmacy.stock am ON am.id = db.id
      LEFT JOIN pharmacy.administrations da ON (
        da.drug_id = p.medication_id 
        AND da.prescription_id = p.prescription_number
        AND da.visit_id IN (
          SELECT v.id FROM visits v WHERE v.patient_id = ${patientId}
        )
      )
      WHERE p.patient_id = ${patientId}
      GROUP BY p.id, p.medication_id, p.dose, p.frequency_per_day, p.duration_days, 
               p.prescription_number, p.start_date, p.created_at, db.full_drug_name, 
               db.unit, am.quantity
      ORDER BY p.created_at DESC
    `) as PresRow[];

    return new Response(JSON.stringify(rows), { status: 200 });
  } catch (err) {
    console.error('Failed to load prescriptions for patient:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
