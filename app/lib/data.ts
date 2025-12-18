import postgres from 'postgres';
import { createClient } from '@/utils/supabase/server';
import {
  PatientField,
  PatientsTableType,
  VisitForm,
  VisitsTable,
  Revenue,
  VisitStats,
  UserField,
  InvoiceForm,
  InvoiceTransfer,
  Role,
  Component,
  RoleOperation,
  UserWithLocal,
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

export async function fetchVisitsByMonth() {
  try {
    const data = await sql<VisitStats[]>`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as visits
      FROM visits 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(month FROM created_at)
      ORDER BY EXTRACT(month FROM created_at)
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch visits data.');
  }
}

export async function fetchLatestVisits() {
  try {
    const supabase = await createClient();
    
    const { data: visits, error } = await supabase
      .from('visits')
      .select(`
        id,
        created_at,
        patient_id,
        persons!visits_patient_id_fkey(last_name, first_name, middle_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('fetchLatestVisits error:', error);
      throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestVisits = (visits as any[])?.map((visit: {
      id: number;
      created_at: string;
      patient_id: number;
      persons: { last_name: string; first_name: string; middle_name: string }[];
    }) => ({
      id: String(visit.id),
      created_at: visit.created_at || '',
      name: visit.persons && visit.persons.length > 0
        ? `${visit.persons[0].last_name} ${visit.persons[0].first_name} ${visit.persons[0].middle_name}`
        : 'Unknown Patient',
      email: 'unknown@example.com',
      image_url: '/patient-avatar.svg',
      amount: '$0.00',
    })) || [];

    return latestVisits;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest visits.');
  }
}

export async function fetchCardData() {
  try {
    const supabase = await createClient();
    
    // Get visit count (respects RLS)
    const { count: visitCount } = await supabase
      .from('visits')
      .select('*', { count: 'exact', head: true });

    // Get patient count
    const patientCountPromise = sql`SELECT COUNT(*) FROM persons`;
    
    // Get visit status (respects RLS)
    const { data: recentVisits } = await supabase
      .from('visits')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const { data: olderVisits } = await supabase
      .from('visits')
      .select('created_at')
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const patientData = await patientCountPromise;

    const numberOfVisits = visitCount || 0;
    const numberOfPatients = Number(patientData[0].count ?? '0');
    const totalRecentVisits = String(recentVisits?.length ?? '0');
    const totalOlderVisits = String(olderVisits?.length ?? '0');

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
    const supabase = await createClient();
    
    // First check RLS access
    const { data: accessCheck } = await supabase
      .from('visits')
      .select('id')
      .limit(1);
    
    if (!accessCheck) {
      throw new Error('Access denied');
    }

    // Use postgres for better join control
    let sqlQuery;
    if (query && query.trim() !== '') {
      const searchPattern = `%${query}%`;
      sqlQuery = sql`
        SELECT 
          v.id,
          v.created_at,
          v.patient_id,
          v.assignment_id,
          v.user_id,
          p.last_name,
          p.first_name,
          p.middle_name,
          u.user_name
        FROM visits v
        LEFT JOIN persons p ON v.patient_id = p.id
        LEFT JOIN users.users u ON v.user_id = u.user_id
        WHERE 
          p.last_name ILIKE ${searchPattern}
          OR p.first_name ILIKE ${searchPattern}
          OR p.middle_name ILIKE ${searchPattern}
        ORDER BY v.created_at DESC
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `;
    } else {
      sqlQuery = sql`
        SELECT 
          v.id,
          v.created_at,
          v.patient_id,
          v.assignment_id,
          v.user_id,
          p.last_name,
          p.first_name,
          p.middle_name,
          u.user_name
        FROM visits v
        LEFT JOIN persons p ON v.patient_id = p.id
        LEFT JOIN users.users u ON v.user_id = u.user_id
        ORDER BY v.created_at DESC
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `;
    }

    const visits = await sqlQuery;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedVisits: VisitsTable[] = (visits as any[]).map((visit: {
      id: number;
      created_at: string;
      patient_id: number;
      assignment_id: number | null;
      user_id: string | null;
      last_name: string | null;
      first_name: string | null;
      middle_name: string | null;
      user_name: string | null;
    }) => ({
      id: String(visit.id),
      created_at: visit.created_at,
      patient_id: String(visit.patient_id),
      assignment_id: visit.assignment_id,
      name: visit.last_name && visit.first_name && visit.middle_name
        ? `${visit.last_name} ${visit.first_name} ${visit.middle_name}`
        : 'Unknown Patient',
      image_url: '/patient-avatar.svg',
      user_name: visit.user_name || 'Unknown User',
    }));

    return formattedVisits;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch visits.');
  }
}

export async function fetchVisitsPages(query: string) {
  try {
    const supabase = await createClient();
    
    let queryBuilder = supabase
      .from('visits')
      .select('id', { count: 'exact', head: true });
    
    if (query && query.trim() !== '') {
      queryBuilder = queryBuilder.or(
        `persons.last_name.ilike.%${query}%,persons.first_name.ilike.%${query}%,persons.middle_name.ilike.%${query}%`
      );
    }
    
    const { count, error } = await queryBuilder;
    
    if (error) throw error;
    
    if (count === null) {
      return 0;
    }

    const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of visits.');
  }
}

export async function fetchVisitById(id: string) {
  try {
    const supabase = await createClient();
    
    // First check if user has access to this visit (RLS will handle this)
    const { data: visitCheck, error: visitError } = await supabase
      .from('visits')
      .select('id')
      .eq('id', id)
      .single();

    if (visitError || !visitCheck) {
      throw new Error('Visit not found or access denied');
    }

    // Now fetch full data using postgres for complex aggregations
    const data = await sql<VisitForm[]>`
      SELECT
        visits.id,
        visits.patient_id,
        complaints.complaints,
        anamnesis_vitae_general.is_new as anamnesis_vitae_unchanged,
        anamnesis_vitae_infections.tuberculosis,
        anamnesis_vitae_infections.hiv,
        anamnesis_vitae_infections.art,
        anamnesis_vitae_infections.hcv,
        anamnesis_vitae_infections.hcv_treatment,
        anamnesis_vitae_infections.hbv,
        anamnesis_vitae_infections.hbv_treatment,
        anamnesis_vitae_infections.other_infectious,
        anamnesis_vitae_other.surgeries,
        anamnesis_vitae_other.injuries,
        anamnesis_vitae_other.allergies,
        anamnesis_vitae_other.disability,
        anamnesis_vitae_other.other_diagnoses,
        anamnesis_vitae_other.seizures,
        anamnesis_vitae_other.seizures_start,
        anamnesis_vitae_other.seizures_last,
        anamnesis_vitae_substance.addiction_specialist,
        anamnesis_vitae_substance.addiction_specialist_details,
        anamnesis_vitae_substance.alcohol_history,
        anamnesis_vitae_substance.alcohol_duration,
        anamnesis_vitae_substance.drug_history,
        anamnesis_vitae_substance.drug_start,
        anamnesis_vitae_substance.drug_last,
        anamnesis_vitae_substance.smoking_history,
        anamnesis_vitae_mental.psychiatrist_care,
        anamnesis_vitae_mental.psychiatrist_details,
        anamnesis_vitae_mental.family_psychiatric_history,
        anamnesis_vitae_mental.self_injurious,
        anamnesis_vitae_mental.self_injurious_date,
        anamnesis_vitae_mental.self_injurious_cause,
        anamnesis_morbi.anamnesis_morbi,
        anamnesis_morbi.duration,
        examinations_general.general_condition,
        examinations_general.consciousness,
        examinations_external.skin,
        examinations_external.mucous,
        examinations_external.swelling,
        examinations_musculoskeletal.musculoskeletal,
        examinations_respiratory.auscultation,
        examinations_cardiovascular.auscultation as auscultation_cardio,
        examinations_cardiovascular.rhythm,
        examinations_gastrointestinal.inspection,
        examinations_gastrointestinal.palpation,
        examinations_gastrointestinal.percussion,
        examinations_gastrointestinal.blumberg,
        examinations_gastrointestinal.liver,
        examinations_gastrointestinal.spleen,
        examinations_gastrointestinal.stool,
        examinations_genitourinary.pasternatski,
        examinations_genitourinary.urination,
        examinations_mental.rapport,
        examinations_mental.orientation,
        examinations_mental.delusions,
        examinations_mental.intellect,
        examinations_mental.perception,
        examinations_mental.thought_process,
        examinations_mental.memory,
        measurements.systolic_blood_pressure::text as systolic_blood_pressure,
        measurements.diastolic_blood_pressure::text as diastolic_blood_pressure,
        measurements.heart_rate::text as heart_rate,
        measurements.temperature::text as temperature,
        measurements.respiratory_rate::text as respiratory_rate,
        measurements.saturation::text as saturation,
        measurements.height::text as height,
        measurements.weight::text as weight,
        measurements."AS"::text as "AS",
        measurements."AD"::text as "AD",
        measurements."VOS"::text as "VOS",
        measurements."VOD"::text as "VOD",
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
              'id', da.drug_id,
              'code', COALESCE(da.drug_id::text, ''),
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
          FROM pharmacy.administrations da
          LEFT JOIN pharmacy.base db ON da.drug_id = db.id
          WHERE da.visit_id = visits.id),
          '[]'::json
        )::text as medications
      FROM visits
      LEFT JOIN complaints ON complaints.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_general ON anamnesis_vitae_general.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_infections ON anamnesis_vitae_infections.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_other ON anamnesis_vitae_other.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_substance ON anamnesis_vitae_substance.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_mental ON anamnesis_vitae_mental.visits_id = visits.id
      LEFT JOIN anamnesis_morbi ON anamnesis_morbi.visit_id = visits.id
      LEFT JOIN examinations_general ON examinations_general.visit_id = visits.id
      LEFT JOIN examinations_external ON examinations_external.visit_id = visits.id
      LEFT JOIN examinations_musculoskeletal ON examinations_musculoskeletal.visit_id = visits.id
      LEFT JOIN examinations_respiratory ON examinations_respiratory.visit_id = visits.id
      LEFT JOIN examinations_cardiovascular ON examinations_cardiovascular.visit_id = visits.id
      LEFT JOIN examinations_gastrointestinal ON examinations_gastrointestinal.visit_id = visits.id
      LEFT JOIN examinations_genitourinary ON examinations_genitourinary.visit_id = visits.id
      LEFT JOIN examinations_mental ON examinations_mental.visit_id = visits.id
      LEFT JOIN measurements ON measurements.visit_id = visits.id
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
      FROM persons
      ORDER BY last_name, first_name;
    `;

    return patients;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all patients.');
  }
}

export async function fetchFilteredPatients(
  query: string,
  currentPage: number = 1,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const data = await sql<PatientsTableType[]>`
		SELECT
		  persons.id,
		  (persons.last_name || ' ' || persons.first_name || ' ' || persons.middle_name) as name,
		  '' as email,
		  '/patient-avatar.svg' as image_url,
		  COUNT(visits.id) AS total_visits,
		  0 AS total_pending,
		  0 AS total_paid
		FROM persons
		LEFT JOIN visits ON persons.id = visits.patient_id
		WHERE
		  (persons.last_name || ' ' || persons.first_name || ' ' || persons.middle_name) ILIKE ${`%${query}%`}
		GROUP BY persons.id, persons.last_name, persons.first_name, persons.middle_name
		ORDER BY persons.last_name, persons.first_name ASC
		LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
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

export async function fetchPatientsPages(query: string) {
  try {
    const data = await sql`SELECT COUNT(*)
    FROM persons
    WHERE
      (persons.last_name || ' ' || persons.first_name || ' ' || persons.middle_name) ILIKE ${`%${query}%`} OR
      ${query} = ''
  `;

    const totalPages = Math.ceil(Number(data[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of patients.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await sql<InvoiceForm[]>`
      SELECT
        id,
        created_at,
        date,
        name,
        from_user_id,
        to_user_id,
        from_local_assignment_id,
        to_local_assignment_id,
        notes
      FROM pharmacy.invoices
      WHERE id = ${id}
    `;

    return data[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchUsers() {
  try {
    const data = await sql<UserField[]>`
      SELECT
        id::text,
        user_name as name,
        au.email
      FROM users.users u
      LEFT JOIN auth.users au ON au.id::uuid = u.user_id::uuid
      ORDER BY user_name ASC
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch users.');
  }
}

export async function fetchAuthUsers() {
  try {
    const data = await sql<UserField[]>`
      SELECT
        id::text,
        email as name,
        email
      FROM auth.users
      ORDER BY email ASC
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch auth users.');
  }
}

export async function fetchUsersWithLocals(): Promise<UserWithLocal[]> {
  try {
    const data = await sql`
      SELECT
        u.user_id::text,
        u.user_name,
        la.id as local_assignment_id,
        l.id as local_id,
        o.organization_name,
        d.department_name,
        r.room_name
      FROM users.users u
      LEFT JOIN users.local_assignments la ON la.user_id = u.user_id
      LEFT JOIN users.locals l ON l.id = la.locals_id
      LEFT JOIN users.organizations o ON o.id = l.organization_id
      LEFT JOIN users.departments d ON d.id = l.department_id
      LEFT JOIN users.rooms r ON r.id = l.room_id
      ORDER BY u.user_name ASC, o.organization_name, d.department_name, r.room_name
    `;

    return data as unknown as UserWithLocal[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch users with locals.');
  }
}

export async function fetchInvoiceTransfers(invoiceId: number) {
  try {
    const data = await sql<InvoiceTransfer[]>`
      SELECT
        t.id,
        t.created_at,
        t.invoice_id,
        t.drug_id,
        t.quantity,
        b.full_drug_name as drug_name,
        b.unit as drug_unit
      FROM pharmacy.transfer t
      LEFT JOIN pharmacy.base b ON b.id = t.drug_id
      WHERE t.invoice_id = ${invoiceId}
      ORDER BY t.created_at DESC
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice transfers.');
  }
}

// --- RBAC Data Fetching Functions ---

// RBAC: Ролі береться безпосередньо з існуючої таблиці users.roles в Supabase
export async function fetchRoles() {
  try {
    const data = await sql<Role[]>`
      SELECT id, role
      FROM users.roles
      ORDER BY role ASC
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch roles.');
  }
}

export async function fetchComponents() {
  try {
    const data = await sql<Component[]>`
      SELECT id, component_name
      FROM users.components
      ORDER BY component_name ASC
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch components.');
  }
}

export async function fetchOperations() {
  try {
    const data = await sql<RoleOperation[]>`
      SELECT id, operations
      FROM users.role_operations
      ORDER BY operations ASC
    `;

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch operations.');
  }
}

export async function fetchUserAssignments(userId: string) {
  try {
    const data = await sql`
      SELECT 
        la.id,
        la.user_id,
        la.locals_id,
        l.id as "local_id",
        l.organization_id,
        l.department_id,
        l.room_id,
        o.id as "org_id",
        o.organization_name as "org_name",
        d.id as "dept_id",
        d.department_name as "dept_name",
        r.id as "room_id",
        r.room_name as "room_name"
      FROM users.local_assignments la
      LEFT JOIN users.locals l ON la.locals_id = l.id
      LEFT JOIN users.organizations o ON l.organization_id = o.id
      LEFT JOIN users.departments d ON l.department_id = d.id
      LEFT JOIN users.rooms r ON l.room_id = r.id
      WHERE la.user_id = ${userId}
    `;

    // Transform to match LocalAssignment type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      locals_id: row.locals_id,
      local: row.local_id ? {
        id: row.local_id,
        organization_id: row.organization_id,
        department_id: row.department_id,
        room_id: row.room_id,
        organization: row.org_id ? {
          id: row.org_id,
          organization_name: row.org_name
        } : undefined,
        department: row.dept_id ? {
          id: row.dept_id,
          department_name: row.dept_name
        } : undefined,
        room: row.room_id ? {
          id: row.room_id,
          room_name: row.room_name
        } : undefined
      } : undefined
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user assignments.');
  }
}
export async function fetchLatestAnamnesiVitae(patientId: string) {
  try {
    const data = await sql`
      SELECT
        anamnesis_vitae_infections.tuberculosis,
        anamnesis_vitae_infections.hiv,
        anamnesis_vitae_infections.art,
        anamnesis_vitae_infections.hcv,
        anamnesis_vitae_infections.hcv_treatment,
        anamnesis_vitae_infections.hbv,
        anamnesis_vitae_infections.hbv_treatment,
        anamnesis_vitae_infections.other_infectious,
        anamnesis_vitae_other.surgeries,
        anamnesis_vitae_other.injuries,
        anamnesis_vitae_other.allergies,
        anamnesis_vitae_other.disability,
        anamnesis_vitae_other.other_diagnoses,
        anamnesis_vitae_other.seizures,
        anamnesis_vitae_other.seizures_start,
        anamnesis_vitae_other.seizures_last,
        anamnesis_vitae_substance.addiction_specialist,
        anamnesis_vitae_substance.addiction_specialist_details,
        anamnesis_vitae_substance.alcohol_history,
        anamnesis_vitae_substance.alcohol_duration,
        anamnesis_vitae_substance.drug_history,
        anamnesis_vitae_substance.drug_start,
        anamnesis_vitae_substance.drug_last,
        anamnesis_vitae_substance.smoking_history,
        anamnesis_vitae_mental.psychiatrist_care,
        anamnesis_vitae_mental.psychiatrist_details,
        anamnesis_vitae_mental.family_psychiatric_history,
        anamnesis_vitae_mental.self_injurious,
        anamnesis_vitae_mental.self_injurious_date,
        anamnesis_vitae_mental.self_injurious_cause
      FROM visits
      LEFT JOIN anamnesis_vitae_general ON anamnesis_vitae_general.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_infections ON anamnesis_vitae_infections.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_other ON anamnesis_vitae_other.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_substance ON anamnesis_vitae_substance.visit_id = visits.id
      LEFT JOIN anamnesis_vitae_mental ON anamnesis_vitae_mental.visits_id = visits.id
      WHERE visits.patient_id = ${patientId}
        AND (anamnesis_vitae_general.is_new = false OR anamnesis_vitae_general.is_new IS NULL)
      ORDER BY visits.created_at DESC
      LIMIT 1
    `;

    return data[0] || null;
  } catch (error) {
    console.error('Database Error:', error);
    return null;
  }
}
// Get the default or first assignment ID for a user
export async function getDefaultAssignmentId(userId: string): Promise<number | null> {
  try {
    const data = await sql`
      SELECT id
      FROM users.local_assignments
      WHERE user_id = ${userId}
      ORDER BY id ASC
      LIMIT 1
    `;
    
    return data[0]?.id ?? null;
  } catch (error) {
    console.error('Database Error:', error);
    return null;
  }
}

// Get all assignments with user and organization info for dropdowns
export async function fetchAssignmentsForDropdown() {
  try {
    const data = await sql`
      SELECT 
        la.id,
        la.user_id,
        o.organization_name,
        d.department_name,
        r.room_name,
        u.email as user_email
      FROM users.local_assignments la
      LEFT JOIN users.locals l ON la.locals_id = l.id
      LEFT JOIN users.organizations o ON l.organization_id = o.id
      LEFT JOIN users.departments d ON l.department_id = d.id
      LEFT JOIN users.rooms r ON l.room_id = r.id
      LEFT JOIN auth.users u ON la.user_id = u.id
      ORDER BY o.organization_name, u.email
    `;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      id: row.id,
      label: `${row.user_email} - ${row.organization_name}${row.department_name ? ` (${row.department_name})` : ''}${row.room_name ? ` - ${row.room_name}` : ''}`
    }));
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

// Fetch organizations
export async function fetchOrganizations() {
  try {
    const data = await sql`
      SELECT id, organization_name
      FROM users.organizations
      ORDER BY organization_name
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

// Fetch departments
export async function fetchDepartments() {
  try {
    const data = await sql`
      SELECT id, department_name
      FROM users.departments
      ORDER BY department_name
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}

// Fetch rooms
export async function fetchRooms() {
  try {
    const data = await sql`
      SELECT id, room_name
      FROM users.rooms
      ORDER BY room_name
    `;
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    return [];
  }
}
