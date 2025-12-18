import Form from '@/app/ui/visits/create-form';
import Breadcrumbs from '@/app/ui/visits/breadcrumbs';
import { fetchPatients } from '@/app/lib/data';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  // Ensure the user is authenticated server-side before rendering the form
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // Not authenticated — redirect to login
    redirect('/auth/login');
  }

  const patients = await fetchPatients();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Visits', href: '/dashboard/visits' },
          {
            label: 'Create Invoice',
            href: '/dashboard/visits/create',
            active: true,
          },
        ]}
      />
      <Form patients={patients} />
    </main>
  );
}