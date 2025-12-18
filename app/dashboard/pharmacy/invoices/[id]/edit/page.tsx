import InvoiceForm from '@/app/ui/pharmacy/invoice-form';
import Breadcrumbs from '@/app/ui/pharmacy/breadcrumbs';
import { fetchInvoiceById, fetchUsersWithLocals } from '@/app/lib/data';
import { notFound } from 'next/navigation';

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    const [invoice, usersWithLocals] = await Promise.all([
        fetchInvoiceById(id),
        fetchUsersWithLocals(),
    ]);

    if (!invoice) {
        notFound();
    }
    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Аптека', href: '/dashboard/pharmacy' },
                    {
                        label: 'Редагувати накладну',
                        href: `/dashboard/pharmacy/invoices/${id}/edit`,
                        active: true,
                    },
                ]}
            />
            <InvoiceForm invoice={invoice} usersWithLocals={usersWithLocals} isEditing={true} />
        </main>
    );
}