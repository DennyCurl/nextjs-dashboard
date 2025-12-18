'use client';

import { UserWithLocal } from '@/app/lib/definitions';
import Link from 'next/link';
import { UserCircleIcon, CalendarDaysIcon, TrashIcon, BeakerIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

import { createInvoice, updateInvoice, deleteInvoice, State } from '@/app/lib/actions';
import { useActionState, useState, useEffect, useCallback } from 'react';
import InvoiceTransfersTable from './invoice-transfers-table';

interface Invoice {
    id: number;
    created_at: string;
    date: string | null;
    name: string | null;
    from_user_id: string | null;
    to_user_id: string | null;
    from_local_assignment_id: number | null;
    to_local_assignment_id: number | null;
    notes: string | null;
}

interface InvoiceFormProps {
    invoice?: Invoice;
    usersWithLocals: UserWithLocal[];
    isEditing?: boolean;
}

export default function InvoiceForm({ invoice, usersWithLocals, isEditing = false }: InvoiceFormProps) {
    const initialState: State = { message: null, errors: {} };

    // Choose action based on mode
    const action = isEditing && invoice ? updateInvoice.bind(null, invoice.id) : createInvoice;
    const [state, formAction] = useActionState(action, initialState);

    // State for medications during creation
    const [availableDrugs, setAvailableDrugs] = useState<Array<{ id: number, name: string, unit: string }>>([]);
    const [tempMedications, setTempMedications] = useState<Array<{ drug_id: number, drug_name: string, quantity: number, unit: string }>>([]);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newMedForm, setNewMedForm] = useState<{ drug_id: number, quantity: number }>({ drug_id: 0, quantity: 1 });

    // States for user and local selection
    const [fromUserId, setFromUserId] = useState<string>(invoice?.from_user_id || '');
    const [toUserId, setToUserId] = useState<string>(invoice?.to_user_id || '');
    const [fromLocalId, setFromLocalId] = useState<number>(invoice?.from_local_assignment_id || 0);
    const [toLocalId, setToLocalId] = useState<number>(invoice?.to_local_assignment_id || 0);

    // Get unique users
    const uniqueUsers = Array.from(
        new Map(usersWithLocals.map(u => [u.user_id, u])).values()
    );

    // Get locals for selected users
    const fromUserLocals = usersWithLocals.filter(u => u.user_id === fromUserId && u.local_assignment_id);
    const toUserLocals = usersWithLocals.filter(u => u.user_id === toUserId && u.local_assignment_id);

    const getLocalDisplayName = (local: UserWithLocal) => {
        const parts = [local.organization_name, local.department_name, local.room_name].filter(Boolean);
        return parts.join(' - ') || 'Без локалізації';
    };

    const fetchAvailableDrugs = useCallback(async () => {
        try {
            const response = await fetch('/api/pharmacy-base?limit=1000');
            if (response.ok) {
                const data = await response.json();
                setAvailableDrugs(data.data.map((drug: { id: number, full_drug_name: string, unit: string }) => ({
                    id: drug.id,
                    name: drug.full_drug_name,
                    unit: drug.unit
                })));
            }
        } catch (error) {
            console.error('Error fetching drugs:', error);
        }
    }, []);

    useEffect(() => {
        if (!isEditing) {
            fetchAvailableDrugs();
        }
    }, [isEditing, fetchAvailableDrugs]);

    const addTempMedication = (drugId: number, quantity: number) => {
        if (drugId === 0 || quantity <= 0) {
            return;
        }

        const selectedDrug = availableDrugs.find(d => d.id === drugId);
        if (!selectedDrug) return;

        // Check if medication already exists
        const existingIndex = tempMedications.findIndex(m => m.drug_id === drugId);
        if (existingIndex >= 0) {
            // Update quantity
            const updated = [...tempMedications];
            updated[existingIndex].quantity = quantity;
            setTempMedications(updated);
        } else {
            // Add new
            setTempMedications([...tempMedications, {
                drug_id: drugId,
                drug_name: selectedDrug.name,
                quantity: quantity,
                unit: selectedDrug.unit
            }]);
        }

        setIsAddingNew(false);
        setNewMedForm({ drug_id: 0, quantity: 1 });
    };

    const handleNewDrugChange = async (drugId: number) => {
        const updatedForm = { ...newMedForm, drug_id: drugId };
        setNewMedForm(updatedForm);
        if (drugId !== 0 && updatedForm.quantity > 0) {
            addTempMedication(drugId, updatedForm.quantity);
        }
    };

    const handleNewQuantityChange = async (quantity: number) => {
        const updatedForm = { ...newMedForm, quantity };
        setNewMedForm(updatedForm);
        if (updatedForm.drug_id !== 0 && quantity > 0) {
            addTempMedication(updatedForm.drug_id, quantity);
        }
    };

    const removeTempMedication = (drugId: number) => {
        setTempMedications(tempMedications.filter(m => m.drug_id !== drugId));
    };

    return (
        <div>
            <form id="invoice-form" action={formAction}>
                <div className="rounded-md bg-gray-50 p-4 md:p-6">
                    {/* Назва накладної */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <label htmlFor="name" className="text-sm font-medium md:pt-2">
                            Назва накладної
                        </label>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    defaultValue={invoice?.name || ''}
                                    placeholder="Введіть назву накладної"
                                    className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                    aria-describedby="name-error"
                                />
                                <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                            </div>
                            <div id="name-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.name &&
                                    state.errors.name.map((error: string) => (
                                        <p className="mt-1 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Дата */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <label htmlFor="date" className="text-sm font-medium md:pt-2">
                            Дата накладної
                        </label>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    defaultValue={invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : ''}
                                    className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                    aria-describedby="date-error"
                                />
                                <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                            </div>
                            <div id="date-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.date &&
                                    state.errors.date.map((error: string) => (
                                        <p className="mt-1 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Від кого - Користувач */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <label htmlFor="from_user_id" className="text-sm font-medium md:pt-2">
                            Від кого (Користувач)
                        </label>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <select
                                    id="from_user_id"
                                    name="from_user_id"
                                    value={fromUserId}
                                    onChange={(e) => {
                                        setFromUserId(e.target.value);
                                        setFromLocalId(0); // Reset local when user changes
                                    }}
                                    className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                    aria-describedby="from_user_id-error"
                                >
                                    <option value="">
                                        Оберіть користувача
                                    </option>
                                    {uniqueUsers.map((user) => (
                                        <option key={user.user_id} value={user.user_id}>
                                            {user.user_name || user.user_id}
                                        </option>
                                    ))}
                                </select>
                                <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                            </div>
                            <div id="from_user_id-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.from_user_id &&
                                    state.errors.from_user_id.map((error: string) => (
                                        <p className="mt-1 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Від кого - Локалізація */}
                    {fromUserId && fromUserLocals.length > 0 && (
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <label htmlFor="from_local_assignment_id" className="text-sm font-medium md:pt-2">
                                Локалізація відправника
                            </label>
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <select
                                        id="from_local_assignment_id"
                                        name="from_local_assignment_id"
                                        value={fromLocalId}
                                        onChange={(e) => setFromLocalId(Number(e.target.value))}
                                        className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                        aria-describedby="from_local_assignment_id-error"
                                    >
                                        <option value="0">
                                            Оберіть локалізацію (опціонально)
                                        </option>
                                        {fromUserLocals.map((local) => (
                                            <option key={local.local_assignment_id} value={local.local_id || 0}>
                                                {getLocalDisplayName(local)}
                                            </option>
                                        ))}
                                    </select>
                                    <BuildingOfficeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                                </div>
                                <div id="from_local_assignment_id-error" aria-live="polite" aria-atomic="true">
                                    {state.errors?.from_local_assignment_id &&
                                        state.errors.from_local_assignment_id.map((error: string) => (
                                            <p className="mt-1 text-sm text-red-500" key={error}>
                                                {error}
                                            </p>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Кому - Користувач */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <label htmlFor="to_user_id" className="text-sm font-medium md:pt-2">
                            Кому (Користувач)
                        </label>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <select
                                    id="to_user_id"
                                    name="to_user_id"
                                    value={toUserId}
                                    onChange={(e) => {
                                        setToUserId(e.target.value);
                                        setToLocalId(0); // Reset local when user changes
                                    }}
                                    className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                    aria-describedby="to_user_id-error"
                                >
                                    <option value="">
                                        Оберіть користувача
                                    </option>
                                    {uniqueUsers.map((user) => (
                                        <option key={user.user_id} value={user.user_id}>
                                            {user.user_name || user.user_id}
                                        </option>
                                    ))}
                                </select>
                                <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                            </div>
                            <div id="to_user_id-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.to_user_id &&
                                    state.errors.to_user_id.map((error: string) => (
                                        <p className="mt-1 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Кому - Локалізація */}
                    {toUserId && toUserLocals.length > 0 && (
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            <label htmlFor="to_local_assignment_id" className="text-sm font-medium md:pt-2">
                                Локалізація отримувача
                            </label>
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <select
                                        id="to_local_assignment_id"
                                        name="to_local_assignment_id"
                                        value={toLocalId}
                                        onChange={(e) => setToLocalId(Number(e.target.value))}
                                        className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                        aria-describedby="to_local_assignment_id-error"
                                    >
                                        <option value="0">
                                            Оберіть локалізацію (опціонально)
                                        </option>
                                        {toUserLocals.map((local) => (
                                            <option key={local.local_assignment_id} value={local.local_id || 0}>
                                                {getLocalDisplayName(local)}
                                            </option>
                                        ))}
                                    </select>
                                    <BuildingOfficeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
                                </div>
                                <div id="to_local_assignment_id-error" aria-live="polite" aria-atomic="true">
                                    {state.errors?.to_local_assignment_id &&
                                        state.errors.to_local_assignment_id.map((error: string) => (
                                            <p className="mt-1 text-sm text-red-500" key={error}>
                                                {error}
                                            </p>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Нотатки */}
                    <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <label htmlFor="notes" className="text-sm font-medium md:pt-2">
                            Нотатки
                        </label>
                        <div className="md:col-span-2">
                            <div className="relative">
                                <textarea
                                    id="notes"
                                    name="notes"
                                    rows={3}
                                    defaultValue={invoice?.notes || ''}
                                    placeholder="Введіть нотатки до накладної"
                                    className="peer block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2 placeholder:text-gray-500"
                                    aria-describedby="notes-error"
                                />
                            </div>
                            <div id="notes-error" aria-live="polite" aria-atomic="true">
                                {state.errors?.notes &&
                                    state.errors.notes.map((error: string) => (
                                        <p className="mt-1 text-sm text-red-500" key={error}>
                                            {error}
                                        </p>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div id="form-error" aria-live="polite" aria-atomic="true">
                        {state.message && (
                            <p className="mt-2 text-sm text-red-500">{state.message}</p>
                        )}
                    </div>

                    {/* Hidden field for temporary medications */}
                    {!isEditing && (
                        <input
                            type="hidden"
                            name="medications"
                            value={JSON.stringify(tempMedications)}
                        />
                    )}
                </div>
            </form>

            {/* Таблиця медикаментів */}
            {isEditing && invoice ? (
                <InvoiceTransfersTable invoiceId={invoice.id} />
            ) : (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <BeakerIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Медикаменти для накладної
                    </h3>

                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-xs">
                                        Медикамент
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Кількість
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Одиниця
                                    </th>
                                    <th className="relative py-3 pl-3 pr-4 sm:pr-6">
                                        <span className="sr-only">Дії</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tempMedications.map((med) => (
                                    <tr key={`temp-${med.drug_id}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs break-words">
                                            {med.drug_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {med.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {med.unit}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <button
                                                onClick={() => removeTempMedication(med.drug_id)}
                                                className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                                title="Видалити медикамент"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* Add new medication row */}
                                {isAddingNew ? (
                                    <tr className="bg-blue-50 border-t-2 border-blue-200">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                                            <select
                                                value={newMedForm.drug_id}
                                                onChange={(e) => handleNewDrugChange(parseInt(e.target.value))}
                                                className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm break-words"
                                                style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}
                                            >
                                                <option value={0}>Оберіть медикамент</option>
                                                {availableDrugs.map((drug) => (
                                                    <option key={drug.id} value={drug.id} style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                                        {drug.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <input
                                                type="number"
                                                value={newMedForm.quantity}
                                                onChange={(e) => handleNewQuantityChange(parseFloat(e.target.value) || 0)}
                                                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                                min="0"
                                                step="0.1"
                                                placeholder="1"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {availableDrugs.find(d => d.id === newMedForm.drug_id)?.unit || 'шт.'}
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <button
                                                onClick={() => { setIsAddingNew(false); setNewMedForm({ drug_id: 0, quantity: 1 }); }}
                                                className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors"
                                                title="Скасувати додавання"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ) : (
                                    <tr className={`hover:bg-gray-50 ${tempMedications.length > 0 ? 'border-t border-dashed border-gray-300' : ''}`}>
                                        <td colSpan={4} className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setIsAddingNew(true)}
                                                className="text-blue-600 hover:text-blue-900 font-medium text-sm transition-colors flex items-center justify-center w-full"
                                                title="Додати медикамент"
                                            >
                                                + Додати медикамент
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {tempMedications.length === 0 && !isAddingNew && (
                        <div className="mt-2 text-sm text-gray-500 text-center">
                            Медикаменти будуть збережені разом з накладною
                        </div>
                    )}
                </div>
            )}

            {/* Кнопки управління */}
            <div className="mt-6 flex justify-between">
                {isEditing && invoice && (
                    <form action={deleteInvoice.bind(null, invoice.id)}>
                        <button
                            type="submit"
                            className="flex h-10 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-500"
                            onClick={(e) => {
                                if (!confirm('Ви впевнені, що хочете видалити цю накладну?')) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Видалити
                        </button>
                    </form>
                )}
                <div className="flex gap-4 ml-auto">
                    <Link
                        href="/dashboard/pharmacy?tab=invoices"
                        className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                    >
                        Скасувати
                    </Link>
                    <button
                        type="submit"
                        form="invoice-form"
                        className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                        {isEditing ? 'Оновити накладну' : 'Створити накладну'}
                    </button>
                </div>
            </div>
        </div>
    );
}