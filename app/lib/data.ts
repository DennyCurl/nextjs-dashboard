import postgres from 'postgres';
import {
  PatientField,
  PatientsTableType,
  VisitForm,
  VisitsTable,
  LatestVisitRaw,
  Revenue,
} from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await sql<Revenue[]>`SELECT * FROM revenue`;

    console.log('Data fetch completed after 3 seconds.');

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestVisits() {
  try {
    const data = await sql<LatestVisitRaw[]>`
      SELECT 
        visits.id,
        visits.created_at,
        patients.last_name || ' ' || patients.first_name || ' ' || patients.middle_name as name,
        users.email,
        '/customers/default-avatar.svg' as image_url,
        '$0.00' as amount
      FROM visits
      JOIN patients ON visits.patient_id = patients.id
      JOIN users ON visits.user_id = users.id
      ORDER BY visits.created_at DESC
      LIMIT 5`;

    const latestVisits = data.map((visit) => ({
      ...visit,
      amount: visit.amount || 'N/A',
    }));
    return latestVisits;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest visits.');
  }
}

export async function fetchCardData() {
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const visitCountPromise = sql`SELECT COUNT(*) FROM visits`;
    const patientCountPromise = sql`SELECT COUNT(*) FROM patients`;
    const visitStatusPromise = sql`SELECT
         COUNT(CASE WHEN visits.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS "recent",
         COUNT(CASE WHEN visits.created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS "older"
         FROM visits`;

    const data = await Promise.all([
      visitCountPromise,
      patientCountPromise,
      visitStatusPromise,
    ]);

    const numberOfVisits = Number(data[0][0].count ?? '0');
    const numberOfPatients = Number(data[1][0].count ?? '0');
    const totalRecentVisits = String(data[2][0].recent ?? '0');
    const totalOlderVisits = String(data[2][0].older ?? '0');

    return {
      numberOfPatients,
      numberOfVisits,
      totalPaidVisits: totalRecentVisits,
      totalPendingVisits: totalOlderVisits,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 20;
export async function fetchFilteredVisits(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const visits = await sql<VisitsTable[]>`
      SELECT
        visits.id,
        visits.created_at::text as created_at,
        visits.patient_id,
        visits.user_id,
        COALESCE(patients.last_name || ' ' || patients.first_name || ' ' || patients.middle_name, 'Unknown Patient') as name,
        '/patients/default-avatar.svg' as image_url,
        COALESCE(users.name, 'Unknown User') as user_name
      FROM visits
      LEFT JOIN patients ON visits.patient_id = patients.id
      LEFT JOIN users ON visits.user_id = users.id
      WHERE
        (patients.last_name || ' ' || patients.first_name || ' ' || patients.middle_name) ILIKE ${`%${query}%`} OR
        users.name ILIKE ${`%${query}%`} OR
        visits.created_at::text ILIKE ${`%${query}%`} OR
        ${query} = ''
      ORDER BY visits.created_at DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    return visits;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch visits.');
  }
}

export async function fetchVisitsPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM visits
    LEFT JOIN patients ON visits.patient_id = patients.id
    LEFT JOIN users ON visits.user_id = users.id
    WHERE
      (patients.last_name || ' ' || patients.first_name || ' ' || patients.middle_name) ILIKE ${`%${query}%`} OR
      users.name ILIKE ${`%${query}%`} OR
      visits.created_at::text ILIKE ${`%${query}%`} OR
      ${query} = ''
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of visits.');
  }
}

export async function fetchVisitById(id: string) {
  try {
    const data = await sql<VisitForm[]>`
      SELECT
        visits.id,
        visits.patient_id,
        examinations.complaints,
        examinations.blood_pressure,
        examinations.heart_rate::text as heart_rate,
        examinations.temperature::text as temperature,
        examinations.examination,
        sick_leave.start_date::text as sick_leave_from,
        sick_leave.end_date::text as sick_leave_to,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', d.diagnosis_id,
              'code', icd3.code_level_3,
              'label', icd3.level_3,
              'note', d.note
            )
          )
          FROM diagnosis d
          LEFT JOIN icd_level_3 icd3 ON d.diagnosis_id = icd3.id
          WHERE d.visit_id = visits.id),
          '[]'::json
        )::text as diagnoses,
        COALESCE(
          (SELECT json_agg(consultations.consultations)
          FROM consultations
          WHERE consultations.visit_id = visits.id),
          '[]'::json
        )::text as consultations,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', da.id_drug,
              'code', COALESCE(da.id_drug::text, ''),
              'label', COALESCE(db.full_drug_name, 'Unknown medication'),
              'dose', da.dose::text,
              'frequencyPerDay', da.frequency_per_day,
              'days', da.duration_days,
              'note', null,
              'prescriptionNumber', null,
              'available_quantity', null,
              'unit', null
            )
          )
          FROM drug_administrations da
          LEFT JOIN "drugBase" db ON da.id_drug = db.id
          WHERE da.id_visit = visits.id),
          '[]'::json
        )::text as medications
      FROM visits
      LEFT JOIN examinations ON examinations.visit_id = visits.id
      LEFT JOIN sick_leave ON sick_leave.visit_id = visits.id
      WHERE visits.id = ${id};
    `;

    const visit = data[0];
    return {
      ...visit,
      other_complaints: '', // This field doesn't exist in schema, set as empty
      heart_rate: visit.heart_rate || '',
      temperature: visit.temperature || '',
      diagnoses: visit.diagnoses || '[]',
      consultations: visit.consultations || '[]',
      medications: visit.medications || '[]'
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch visit.');
  }
}

export async function fetchPatients() {
  try {
    const patients = await sql<PatientField[]>`
      SELECT
        id,
        CONCAT(last_name, ' ', first_name, ' ', middle_name, ', ', TO_CHAR(birth_date, 'DD.MM.YYYY'))  AS full_name
      FROM patients
      ORDER BY last_name, first_name;
    `;

    return patients;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all patients.');
  }
}

export async function fetchFilteredPatients(query: string) {
  try {
    const data = await sql<PatientsTableType[]>`
		SELECT
		  patients.id,
		  (patients.last_name || ' ' || patients.first_name || ' ' || patients.middle_name) as name,
		  patients.email,
		  '/customers/default-avatar.svg' as image_url,
		  COUNT(visits.id) AS total_visits,
		  COUNT(CASE WHEN visits.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS total_pending,
		  COUNT(CASE WHEN visits.created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS total_paid
		FROM patients
		LEFT JOIN visits ON patients.id = visits.patient_id
		WHERE
		  (patients.last_name || ' ' || patients.first_name || ' ' || patients.middle_name) ILIKE ${`%${query}%`} OR
        patients.email ILIKE ${`%${query}%`}
		GROUP BY patients.id, patients.last_name, patients.first_name, patients.middle_name, patients.email
		ORDER BY patients.last_name, patients.first_name ASC
	  `;

    const patients = data.map((patient) => ({
      ...patient,
      total_pending: String(patient.total_pending),
      total_paid: String(patient.total_paid),
    }));

    return patients;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch patient table.');
  }
}
