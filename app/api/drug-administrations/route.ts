import postgres from 'postgres';
import type { NextRequest } from 'next/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

type DrugAdministrationRow = {
    id: number;
    id_drug: number | null;
    id_visit: number | null;
    id_prescription: string | null;
    dose: number | null;
    frequency_per_day: number | null;
    duration_days: number | null;
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
          da.id_drug,
          da.id_visit,
          da.id_prescription,
          da.dose,
          da.frequency_per_day,
          da.duration_days,
          db.full_drug_name AS drug_name,
          db.unit
        FROM drug_administrations da
        LEFT JOIN "drugBase" db ON db.id = da.id_drug
        WHERE da.id_visit = ${Number(visitId)}
        ORDER BY da.id DESC
      `) as DrugAdministrationRow[];
        } else if (patientId) {
            // Get drug administrations for all visits of a specific patient
            rows = (await sql`
        SELECT 
          da.id,
          da.id_drug,
          da.id_visit,
          da.id_prescription,
          da.dose,
          da.frequency_per_day,
          da.duration_days,
          db.full_drug_name AS drug_name,
          db.unit,
          v.created_at AS visit_date
        FROM drug_administrations da
        LEFT JOIN "drugBase" db ON db.id = da.id_drug
        LEFT JOIN visits v ON v.id = da.id_visit
        WHERE v.patient_id = ${Number(patientId)}
        ORDER BY da.id DESC
      `) as DrugAdministrationRow[];
        } else {
            // Get all drug administrations (limited to last 100 for performance)
            rows = (await sql`
        SELECT 
          da.id,
          da.id_drug,
          da.id_visit,
          da.id_prescription,
          da.dose,
          da.frequency_per_day,
          da.duration_days,
          db.full_drug_name AS drug_name,
          db.unit,
          CONCAT(p.last_name, ' ', p.first_name, ' ', p.middle_name) AS patient_name,
          v.created_at AS visit_date
        FROM drug_administrations da
        LEFT JOIN "drugBase" db ON db.id = da.id_drug
        LEFT JOIN visits v ON v.id = da.id_visit
        LEFT JOIN patients p ON p.id = v.patient_id
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