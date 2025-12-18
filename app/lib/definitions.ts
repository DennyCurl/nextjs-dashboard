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

export type VisitStats = {
  month: string;
  visits: number;
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
  assignment_id: number | null;
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
  anamnesis_vitae_unchanged?: boolean;
  anamnesis_morbi?: string;
  duration?: string;
  diagnoses?: string;
  medications?: string;
  consultations?: string;
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

export type UserField = {
  id: string;
  name: string;
  email?: string;
};

export type InvoiceForm = {
  id: number;
  created_at: string;
  date: string | null;
  name: string | null;
  from_user_id: string | null;  // UUID from users.users
  to_user_id: string | null;    // UUID from users.users
  from_local_assignment_id: number | null;  // locals.id
  to_local_assignment_id: number | null;    // locals.id
  notes: string | null;
};

export type UserWithLocal = {
  user_id: string;
  user_name: string | null;
  local_assignment_id: number | null;
  local_id: number | null;
  organization_name: string | null;
  department_name: string | null;
  room_name: string | null;
};

export type InvoiceTransfer = {
  id: number;
  created_at: string;
  invoice_id: number;
  drug_id: number;
  quantity: number;
  drug_name?: string;
  drug_unit?: string;
};

// --- RBAC System Types ---

export type Role = {
  id: number;
  role: string;
};

export type RoleAssignment = {
  id: number;
  user_id: string;
  role_id: number;
  role?: Role; // Optional populated role
  user?: {
    id: string;
    name?: string;
    email?: string;
  }; // Optional populated user
};

export type RoleOperation = {
  id: number;
  operations: string;
};

export type Component = {
  id: number;
  component_name: string;
};

export type RolePermission = {
  id: number;
  role_id: number;
  component_id: number;
  operation_id: number;
  role?: Role; // Optional populated role
  component?: Component; // Optional populated component
  operation?: RoleOperation; // Optional populated operation
};

// Types for permission checking
export type UserPermissions = {
  [component: string]: string[]; // component_name -> array of operations
};

export type PermissionCheck = {
  component: string;
  operation: string;
};

// Form types for RBAC management
export type RoleFormData = {
  role: string;
};

export type ComponentFormData = {
  component_name: string;
};

export type OperationFormData = {
  operations: string;
};

export type RolePermissionFormData = {
  role_id: number;
  component_id: number;
  operation_id: number;
};

export type RoleAssignmentFormData = {
  user_id: string;
  role_id: number;
};

// --- User Assignment Types ---

export type Organization = {
  id: number;
  organization_name: string;
};

export type Department = {
  id: number;
  department_name: string | null;
};

export type Room = {
  id: number;
  room_name: string;
};

export type Local = {
  id: number;
  organization_id: number;
  department_id: number | null;
  room_id: number | null;
  organization?: Organization;
  department?: Department;
  room?: Room;
};

export type LocalAssignment = {
  id: number;
  user_id: string;
  locals_id: number;
  user_name?: string;
  local?: Local;
};

export type AppUser = {
  user_id: string;
  user_name: string | null;
  created_at: string;
};
