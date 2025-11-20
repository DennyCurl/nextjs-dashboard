import { PatientField, VisitForm as VisitFormType } from '@/app/lib/definitions';
import VisitForm from './visit-form';

interface EditVisitFormProps {
  visit: VisitFormType;
  patients: PatientField[];
}

export default function EditVisitForm({ visit, patients }: EditVisitFormProps) {
  return <VisitForm patients={patients} visit={visit} isEditing={true} />;
}
