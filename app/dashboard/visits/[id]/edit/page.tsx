import Form from '@/app/ui/visits/edit-form';
import Breadcrumbs from '@/app/ui/visits/breadcrumbs';
import { fetchVisitById, fetchPatients } from '@/app/lib/data';
import { notFound } from 'next/navigation';
 
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const [visit, patients] = await Promise.all([
    fetchVisitById(id),
    fetchPatients(),
  ]);

  if (!visit) {
    notFound();
  }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Visits', href: '/dashboard/visits' },
          {
            label: 'Edit Visit',
            href: `/dashboard/visits/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form visit={visit} patients={patients} />
    </main>
  );
}