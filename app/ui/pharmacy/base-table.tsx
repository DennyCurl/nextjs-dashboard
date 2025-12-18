'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDateSafe } from '@/app/lib/date-utils';

interface PharmacyBaseItem {
    id: number;
    created_at: string;
    full_drug_name: string;
    id_drugClassification: number | null;
    unit: string | null;
    number: number | null;
    classification_code: string | null;
    classification_name: string | null;
    classification_level: number | null;
    classification_type: string | null;
}interface PharmacyBaseResponse {
    data: PharmacyBaseItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function PharmacyBaseTable() {
    const [data, setData] = useState<PharmacyBaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [classificationType, setClassificationType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
    });

    const fetchData = async (page: number = 1, search: string = '', type: string = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            if (search) {
                params.append('q', search);
            }

            if (type) {
                params.append('type', type);
            }

            const response = await fetch(`/api/pharmacy-base?${params}`);
            const result: PharmacyBaseResponse = await response.json();

            setData(result.data);
            setPagination(result.pagination);
            setCurrentPage(page);
        } catch (error) {
            console.error('Failed to fetch pharmacy data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchData(1, searchTerm, classificationType);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, classificationType]);

    const handlePageChange = (page: number) => {
        fetchData(page, searchTerm, classificationType);
    };

    const formatDate = (dateString: string) => {
        return formatDateSafe(dateString);
    };

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Пошук медикаментів..."
                        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="sm:w-48">
                    <select
                        value={classificationType}
                        onChange={(e) => setClassificationType(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 py-2 px-3 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="">Всі типи</option>
                        <option value="atc">ATC (Лікарські засоби)</option>
                        <option value="vmp">VMP (Медичні пристрої)</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Назва медикаменту
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Класифікація
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Одиниця
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Номер
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Дата створення
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    Завантаження...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                    Медикаменти не знайдені
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {item.full_drug_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {item.classification_code && item.classification_name ? (
                                            <div>
                                                <div className="font-medium">
                                                    {item.classification_code} - {item.classification_name}
                                                </div>
                                                {item.classification_type && (
                                                    <div className="text-xs text-gray-400">
                                                        Тип: {item.classification_type.toUpperCase()}
                                                        {item.classification_level !== null && ` | Рівень: ${item.classification_level}`}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            'Не вказано'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.unit || 'Не вказано'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.number || 'Не вказано'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                                        {formatDate(item.created_at)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <p className="text-sm text-gray-700">
                                Показано{' '}
                                <span className="font-medium">
                                    {pagination.limit > 0 ? ((currentPage - 1) * pagination.limit) + 1 : 0}
                                </span>{' '}
                                до{' '}
                                <span className="font-medium">
                                    {pagination.total > 0 ? Math.min(currentPage * pagination.limit, pagination.total) : 0}
                                </span>{' '}
                                з{' '}
                                <span className="font-medium">{pagination.total || 0}</span>{' '}
                                результатів
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Попередня
                            </button>

                            {/* Page numbers */}
                            {pagination.totalPages > 0 && Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const startPage = Math.max(1, currentPage - 2);
                                const pageNum = startPage + i;
                                if (pageNum > pagination.totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md ${pageNum === currentPage
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages || pagination.totalPages === 0}
                                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Наступна
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}