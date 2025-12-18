'use client';

import { useState, useEffect, useCallback } from 'react';
import { InvoiceTransfer } from '@/app/lib/definitions';
import { BeakerIcon, TrashIcon } from '@heroicons/react/24/outline';

interface InvoiceTransfersTableProps {
    invoiceId: number;
}

export default function InvoiceTransfersTable({ invoiceId }: InvoiceTransfersTableProps) {
    const [transfers, setTransfers] = useState<InvoiceTransfer[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingTransfer, setEditingTransfer] = useState<number | null>(null);
    const [availableDrugs, setAvailableDrugs] = useState<Array<{ id: number, name: string, unit: string }>>([]);
    const [editForm, setEditForm] = useState<{ drug_id: number, quantity: number }>({ drug_id: 0, quantity: 0 });
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newForm, setNewForm] = useState<{ drug_id: number, quantity: number }>({ drug_id: 0, quantity: 1 });

    const fetchTransfers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/invoice-transfers?invoiceId=${invoiceId}`);
            if (response.ok) {
                const data = await response.json();
                setTransfers(data);
            }
        } catch (error) {
            console.error('Error fetching transfers:', error);
        } finally {
            setLoading(false);
        }
    }, [invoiceId]);

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

    const handleDeleteTransfer = async (transferId: number) => {
        if (!confirm('Ви впевнені, що хочете видалити цей медикамент з накладної?')) {
            return;
        }

        try {
            const response = await fetch(`/api/invoice-transfers/${transferId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Refresh the transfers list
                await fetchTransfers();
            } else {
                alert('Помилка при видаленні медикаменту');
            }
        } catch (error) {
            console.error('Error deleting transfer:', error);
            alert('Помилка при видаленні медикаменту');
        }
    };

    const startEditing = (transfer: InvoiceTransfer) => {
        setEditingTransfer(transfer.id);
        setEditForm({
            drug_id: transfer.drug_id,
            quantity: transfer.quantity
        });
    };

    const cancelEditing = () => {
        setEditingTransfer(null);
        setEditForm({ drug_id: 0, quantity: 0 });
    };

    const saveTransfer = async (transferId: number, drugId: number, quantity: number) => {
        if (drugId === 0 || quantity <= 0) {
            return;
        }

        try {
            const response = await fetch(`/api/invoice-transfers/${transferId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ drug_id: drugId, quantity }),
            });

            if (response.ok) {
                await fetchTransfers();
                setEditingTransfer(null);
            } else {
                console.error('Failed to save transfer');
            }
        } catch (error) {
            console.error('Error saving transfer:', error);
        }
    };

    const handleEditDrugChange = async (transferId: number, drugId: number) => {
        setEditForm({ ...editForm, drug_id: drugId });
        if (drugId !== 0 && editForm.quantity > 0) {
            await saveTransfer(transferId, drugId, editForm.quantity);
        }
    };

    const handleEditQuantityChange = async (transferId: number, quantity: number) => {
        setEditForm({ ...editForm, quantity });
        if (editForm.drug_id !== 0 && quantity > 0) {
            await saveTransfer(transferId, editForm.drug_id, quantity);
        }
    };

    const startAddingNew = () => {
        setIsAddingNew(true);
        setNewForm({ drug_id: 0, quantity: 1 });
        setEditingTransfer(null); // Cancel any existing edits
    };

    const cancelAddingNew = () => {
        setIsAddingNew(false);
        setNewForm({ drug_id: 0, quantity: 1 });
    };

    const saveNewTransfer = async (drugId: number, quantity: number) => {
        if (drugId === 0 || quantity <= 0) {
            return;
        }

        try {
            const response = await fetch('/api/invoice-transfers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    invoice_id: invoiceId,
                    drug_id: drugId,
                    quantity: quantity
                })
            });

            if (response.ok) {
                await fetchTransfers(); // Refresh the list
                cancelAddingNew();
            } else {
                console.error('Failed to add transfer');
            }
        } catch (error) {
            console.error('Error adding transfer:', error);
        }
    };

    const handleNewDrugChange = async (drugId: number) => {
        setNewForm({ ...newForm, drug_id: drugId });
        if (drugId !== 0 && newForm.quantity > 0) {
            await saveNewTransfer(drugId, newForm.quantity);
        }
    };

    const handleNewQuantityChange = async (quantity: number) => {
        setNewForm({ ...newForm, quantity });
        if (newForm.drug_id !== 0 && quantity > 0) {
            await saveNewTransfer(newForm.drug_id, quantity);
        }
    };

    useEffect(() => {
        if (invoiceId) {
            fetchTransfers();
            fetchAvailableDrugs();
        }
    }, [invoiceId, fetchTransfers, fetchAvailableDrugs]);

    if (loading) {
        return (
            <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Медикаменти по накладній</h3>
                <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <BeakerIcon className="h-5 w-5 mr-2 text-gray-500" />
                Медикаменти по накладній
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
                        {transfers.map((transfer) => (
                            <tr key={transfer.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                                    {editingTransfer === transfer.id ? (
                                        <select
                                            value={editForm.drug_id}
                                            onChange={(e) => handleEditDrugChange(transfer.id, parseInt(e.target.value))}
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
                                    ) : (
                                        <button
                                            onClick={() => startEditing(transfer)}
                                            className="text-left hover:text-blue-600 transition-colors break-words"
                                            title="Клікніть для редагування"
                                        >
                                            {transfer.drug_name || 'Невідомий медикамент'}
                                        </button>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {editingTransfer === transfer.id ? (
                                        <input
                                            type="number"
                                            value={editForm.quantity}
                                            onChange={(e) => handleEditQuantityChange(transfer.id, parseFloat(e.target.value) || 0)}
                                            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                            min="0"
                                            step="0.1"
                                        />
                                    ) : (
                                        <button
                                            onClick={() => startEditing(transfer)}
                                            className="text-left hover:text-blue-600 transition-colors"
                                            title="Клікніть для редагування"
                                        >
                                            {transfer.quantity}
                                        </button>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {editingTransfer === transfer.id
                                        ? availableDrugs.find(d => d.id === editForm.drug_id)?.unit || 'шт.'
                                        : transfer.drug_unit || 'шт.'
                                    }
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    {editingTransfer === transfer.id ? (
                                        <button
                                            onClick={cancelEditing}
                                            className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors"
                                            title="Скасувати редагування"
                                        >
                                            ✕
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDeleteTransfer(transfer.id)}
                                            className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                            title="Видалити медикамент"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {/* Add new transfer row */}
                        {isAddingNew ? (
                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs">
                                    <select
                                        value={newForm.drug_id}
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
                                        value={newForm.quantity}
                                        onChange={(e) => handleNewQuantityChange(parseFloat(e.target.value) || 0)}
                                        className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                        min="0"
                                        step="0.1"
                                        placeholder="1"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {availableDrugs.find(d => d.id === newForm.drug_id)?.unit || 'шт.'}
                                </td>
                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                    <button
                                        onClick={cancelAddingNew}
                                        className="text-gray-600 hover:text-gray-900 p-1 rounded-md hover:bg-gray-50 transition-colors"
                                        title="Скасувати додавання"
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ) : (
                            <tr className="hover:bg-gray-50 border-t border-dashed border-gray-300">
                                <td colSpan={4} className="px-6 py-4 text-center">
                                    <button
                                        onClick={startAddingNew}
                                        className="text-blue-600 hover:text-blue-900 font-medium text-sm transition-colors flex items-center justify-center w-full"
                                        title="Додати новий медикамент"
                                    >
                                        + Додати медикамент
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}