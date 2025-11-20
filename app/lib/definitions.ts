// This file contains type definitions for your data.
// It describes the shape of the data, and what data type each property should accept.
// For simplicity of teaching, we're manually defining these types.
// However, these types are generated automatically if you're using an ORM such as Prisma.
export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type Patient = {
  id: string;
  name: string;
  email: string;
  image_url: string;
};

export type Visit = {
  id: string;
  patient_id: string;
  amount: number;
  date: string;
  // In TypeScript, this is called a string union type.
  // It means that the "status" property can only be one of the two strings: 'pending' or 'paid'.
  status: 'pending' | 'paid';
};

export type Revenue = {
  month: string;
  revenue: number;
};

export type LatestVisit = {
  id: string;
  name: string;
  image_url: string;
  email: string;
  amount: string;
  created_at?: string;
};

// The database returns a number for amount, but we later format it to a string with the formatCurrency function
export type LatestVisitRaw = Omit<LatestVisit, 'amount'> & {
  amount: number;
};

export type VisitsTable = {
  id: string;
  created_at: string;
  patient_id: string;
  user_id: string;
  name: string;
  image_url: string;
  user_name?: string;
};

export type PatientsTableType = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_visits: number;
  total_pending: number;
  total_paid: number;
};

export type FormattedPatientsTable = {
  id: string;
  name: string;
  email: string;
  image_url: string;
  total_visits: number;
  total_pending: string;
  total_paid: string;
};

export type PatientField = {
  id: string;
  full_name: string;
};

// Тип одного елемента (скарги)
export type ComplaintOption = {
  id: string;
  label: string;
};

// Тип масиву всіх скарг
export type ComplaintsList = ComplaintOption[];

// Тип для стану у формі
export type ComplaintsState = string[];


export type VisitForm = {
  id: string;
  patient_id: string;
  complaints?: string;
  other_complaints?: string;
  diagnoses?: string;
  medications?: string;
  consultations?: string;
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  examination?: string;
  sick_leave_from?: string;
  sick_leave_to?: string;
};

// --- Common app types used in forms/components ---
export type SelectedDiagnosis = {
  id?: number | null;
  code: string;
  label: string;
  note?: string | null;
};

export type SelectedMedication = {
  id?: number | null;
  code: string;
  label: string;
  dose?: string | null;
  note?: string | null;
  // times per day
  frequencyPerDay?: number | null;
  // how many days remaining/prescribed
  days?: number | null;
  // prescription sheet number (if came from prescriptions table)
  prescriptionNumber?: string | null;
  // available quantity and unit for display
  available_quantity?: number | null;
  unit?: string | null;
};
