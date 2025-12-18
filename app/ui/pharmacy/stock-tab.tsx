'use client';

import { useState, useEffect, useCallback } from 'react';

interface StockItem {
    id: number;
    drug_name: string;
    quantity: number;
    unit?: string;
    room_name?: string;
}

export default function StockTab() {
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const limit = 50;

    // Load current localization from API
    useEffect(() => {
        const loadCurrentLocalization = async () => {
            try {
                const response = await fetch('/api/current-localization');
                if (response.ok) {
                    const data = await response.json();
                    if (data.current && data.current.locals_id) {
                        setSelectedAssignmentId(data.current.locals_id);
                    }
                }
            } catch (error) {
                console.error('Error loading current localization:', error);
            }
        };

        loadCurrentLocalization();

        // Listen for localization changes
        const handleLocalizationChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ localsId: number }>;
            if (customEvent.detail?.localsId) {
                setSelectedAssignmentId(customEvent.detail.localsId);
                setCurrentPage(1);
            }
        };

        window.addEventListener('localizationChanged', handleLocalizationChange);
        return () => {
            window.removeEventListener('localizationChanged', handleLocalizationChange);
        };
    }, []);

    const fetchStock = useCallback(async () => {
        if (!selectedAssignmentId) {
            setInitialLoading(false);
            return;
        }

        try {
            setLoading(true);
            const searchQuery = debouncedSearchTerm ? `&search=${encodeURIComponent(debouncedSearchTerm)}` : '';
            const url = `/api/pharmacy-stock?page=${currentPage}&limit=${limit}${searchQuery}`;
            
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch stock');
            }

            const data = await response.json();
            setStockItems(data.data || []);
        } catch (error) {
            console.error('Error fetching stock:', error);
            setStockItems([]);
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, limit, selectedAssignmentId]);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchStock();
    }, [fetchStock]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!selectedAssignmentId) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="text-center">
                    <p className="text-gray-500 text-sm">
                        Будь ласка, оберіть локалізацію в панелі користувача
                    </p>
                </div>
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
                        placeholder="Пошук медикаментів за назвою..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                                Кімната
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Кількість
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Одиниці
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    Завантаження...
                                </td>
                            </tr>
                        ) : stockItems.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                                    Немає даних про залишки
                                </td>
                            </tr>
                        ) : (
                            stockItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {item.drug_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.room_name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.unit || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}