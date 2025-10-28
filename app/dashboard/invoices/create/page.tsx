import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchPatients } from '@/app/lib/data';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Page() {
  // Ensure the user is authenticated server-side before rendering the form
  // Call the same `auth` handler used by middleware to obtain the auth object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await (auth as any)();
  const userId = (session as unknown as { user?: { id?: string } })?.user?.id ?? null;

  // Debug: log session and cookie header to help diagnose missing session
  // eslint-disable-next-line no-console
  console.warn('create page: session=', session);
  // eslint-disable-next-line no-console
  const h = await headers();
  console.warn('create page: cookie header=', h.get('cookie'));

  if (!userId) {
    // Not authenticated — redirect to login (handled server-side)
    redirect('/login');
  }

  const patients = await fetchPatients();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Create Invoice',
            href: '/dashboard/invoices/create',
            active: true,
          },
        ]}
      />
      <Form patients={patients} />
    </main>
  );
}