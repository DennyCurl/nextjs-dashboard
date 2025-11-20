import { PatientField } from '@/app/lib/definitions';
import VisitForm from './visit-form';

export default function Form({ patients }: { patients: PatientField[] }) {
  return <VisitForm patients={patients} isEditing={false} />;
}
