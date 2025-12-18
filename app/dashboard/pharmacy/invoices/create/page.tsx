import InvoiceForm from '@/app/ui/pharmacy/invoice-form';
import Breadcrumbs from '@/app/ui/pharmacy/breadcrumbs';
import { fetchUsersWithLocals } from '@/app/lib/data';

export default async function Page() {
    const usersWithLocals = await fetchUsersWithLocals();

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Аптека', href: '/dashboard/pharmacy' },
                    {
                        label: 'Створити накладну',
                        href: '/dashboard/pharmacy/invoices/create',
                        active: true,
                    },
                ]}
            />
            <InvoiceForm usersWithLocals={usersWithLocals} isEditing={false} />
        </main>
    );
}