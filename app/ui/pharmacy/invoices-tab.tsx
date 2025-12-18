'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { formatDateSafe } from '@/app/lib/date-utils';

interface Invoice {
    id: number;
    created_at: string;
    date: string | null;
    name: string | null;
    from_id: string | null;  // Now UUID from auth.users
    to_id: string | null;    // Now UUID from auth.users
    notes: string | null;
    from_user_name?: string | null;
    from_user_email?: string | null;
    to_user_name?: string | null;
    to_user_email?: string | null;
}

export default function InvoicesTab() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const limit = 20;

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const searchQuery = debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : '';
            const response = await fetch(`/api/pharmacy-invoices?page=${currentPage}&limit=${limit}${searchQuery}`);

            if (!response.ok) {
                throw new Error('Failed to fetch invoices');
            }

            const data = await response.json();
            setInvoices(data.data || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setInvoices([]);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, limit]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 800); // Wait 800ms after user stops typing

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header with Search */}
            <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Пошук за назвою накладної, нотатками або користувачем..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
                <a
                    href="/dashboard/pharmacy/invoices/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Нова накладна
                </a>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md relative">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Назва
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Від кого
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Кому
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Дата
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Дії
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {invoice.name || 'Без назви'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {invoice.from_user_name || invoice.from_user_email ? (
                                        <div>
                                            <div className="font-medium">{invoice.from_user_name || invoice.from_user_email}</div>
                                            {invoice.from_user_email && invoice.from_user_name && (
                                                <div className="text-xs text-gray-400">{invoice.from_user_email}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Не вказано</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {invoice.to_user_name || invoice.to_user_email ? (
                                        <div>
                                            <div className="font-medium">{invoice.to_user_name || invoice.to_user_email}</div>
                                            {invoice.to_user_email && invoice.to_user_name && (
                                                <div className="text-xs text-gray-400">{invoice.to_user_email}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Не вказано</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {invoice.date ? formatDateSafe(invoice.date) : 'Не вказано'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex justify-end">
                                        <a
                                            href={`/dashboard/pharmacy/invoices/${invoice.id}/edit`}
                                            className="rounded-md border p-2 hover:bg-gray-100"
                                        >
                                            <PencilIcon className="w-5" />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}