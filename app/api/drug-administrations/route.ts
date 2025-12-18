import postgres from 'postgres';
import type { NextRequest } from 'next/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

type DrugAdministrationRow = {
    id: number;
    drug_id: number | null;
    visit_id: number | null;
    prescription_id: string | null;
    dose: number | null;
    frequency_per_day: number | null;
    duration_days: number | null;
    user_id: string | null;
    drug_name?: string | null;
    unit?: string | null;
    patient_name?: string | null;
    visit_date?: string | null;
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const visitId = searchParams.get('visitId');
        const patientId = searchParams.get('patientId');

        let rows: DrugAdministrationRow[];

        if (visitId) {
            // Get drug administrations for specific visit
            rows = (await sql`
        SELECT 
          da.id,
          da.drug_id,
          da.visit_id,
          da.prescription_id,
          da.dose,
          da.frequency_per_day,
          da.duration_days,
          da.user_id,
          db.full_drug_name AS drug_name,
          db.unit
        FROM pharmacy.administrations da
        LEFT JOIN pharmacy.base db ON db.id = da.drug_id
        WHERE da.visit_id = ${Number(visitId)}
        ORDER BY da.id DESC
      `) as DrugAdministrationRow[];
        } else if (patientId) {
            // Get drug administrations for all visits of a specific patient
            rows = (await sql`
        SELECT 
          da.id,
          da.drug_id,
          da.visit_id,
          da.prescription_id,
          da.dose,
          da.frequency_per_day,
          da.duration_days,
          da.user_id,
          db.full_drug_name AS drug_name,
          db.unit,
          v.created_at AS visit_date
        FROM pharmacy.administrations da
        LEFT JOIN pharmacy.base db ON db.id = da.drug_id
        LEFT JOIN visits v ON v.id = da.visit_id
        WHERE v.patient_id = ${Number(patientId)}
        ORDER BY da.id DESC
      `) as DrugAdministrationRow[];
        } else {
            // Get all drug administrations (limited to last 100 for performance)
            rows = (await sql`
        SELECT 
          da.id,
          da.drug_id,
          da.visit_id,
          da.prescription_id,
          da.dose,
          da.frequency_per_day,
          da.duration_days,
          da.user_id,
          db.full_drug_name AS drug_name,
          db.unit,
          (p.last_name || ' ' || p.first_name || ' ' || p.middle_name) AS patient_name,
          v.created_at AS visit_date
        FROM pharmacy.administrations da
        LEFT JOIN pharmacy.base db ON db.id = da.drug_id
        LEFT JOIN visits v ON v.id = da.visit_id
        LEFT JOIN persons p ON p.id = v.patient_id
        ORDER BY da.id DESC
        LIMIT 100
      `) as DrugAdministrationRow[];
        }

        return new Response(JSON.stringify(rows), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });

    } catch (error) {
        console.error('Error fetching drug administrations:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch drug administrations',
                details: error instanceof Error ? error.message : String(error)
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
    }
}