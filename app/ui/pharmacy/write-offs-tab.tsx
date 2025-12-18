'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/utils/supabase/client';

interface WriteOff {
    id: number;
    created_at: string;
    quantity: number;
    assignment_id: number;
    user_id: string;
    drug_id: number;
    drug_name?: string;
    unit?: string;
    user_name?: string;
}

interface StockItem {
    id: number;
    drug_name: string;
    quantity: number;
    unit?: string;
}

export default function WriteOffsTab() {
    const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [availableStock, setAvailableStock] = useState<StockItem[]>([]);
    const [selectedDrug, setSelectedDrug] = useState<number | null>(null);
    const [writeOffQuantity, setWriteOffQuantity] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    // Get user ID from Supabase
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
            }
        });
    }, []);

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
            }
        };

        window.addEventListener('localizationChanged', handleLocalizationChange);
        return () => {
            window.removeEventListener('localizationChanged', handleLocalizationChange);
        };
    }, []);

    const fetchWriteOffs = useCallback(async () => {
        if (!selectedAssignmentId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/pharmacy-writeoffs?assignment_id=${selectedAssignmentId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch write-offs');
            }

            const data = await response.json();
            setWriteOffs(data || []);
        } catch (error) {
            console.error('Error fetching write-offs:', error);
            setWriteOffs([]);
        } finally {
            setLoading(false);
        }
    }, [selectedAssignmentId]);

    useEffect(() => {
        fetchWriteOffs();
    }, [fetchWriteOffs]);

    const fetchAvailableStock = async () => {
        if (!selectedAssignmentId) return;

        try {
            const response = await fetch(`/api/pharmacy-stock?assignment_id=${selectedAssignmentId}&limit=1000`);
            if (!response.ok) throw new Error('Failed to fetch stock');
            
            const result = await response.json();
            setAvailableStock(result.data || []);
        } catch (error) {
            console.error('Error fetching stock:', error);
            setAvailableStock([]);
        }
    };

    const handleOpenModal = () => {
        setShowModal(true);
        setError(null);
        setSelectedDrug(null);
        setWriteOffQuantity(0);
        fetchAvailableStock();
    };

    const handleCreateWriteOff = async () => {
        if (!selectedDrug || !writeOffQuantity || !selectedAssignmentId || !userId) {
            setError('Заповніть всі поля');
            return;
        }

        try {
            const response = await fetch('/api/pharmacy-writeoffs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drug_id: selectedDrug,
                    quantity: writeOffQuantity,
                    assignment_id: selectedAssignmentId,
                    user_id: userId
                })
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Помилка створення списання');
                return;
            }

            setShowModal(false);
            fetchWriteOffs();
        } catch (error) {
            console.error('Error creating write-off:', error);
            setError('Помилка з\'єднання з сервером');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Видалити це списання?')) return;

        try {
            const response = await fetch(`/api/pharmacy-writeoffs?id=${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete write-off');
            }

            fetchWriteOffs();
        } catch (error) {
            console.error('Error deleting write-off:', error);
            alert('Помилка видалення списання');
        }
    };

    const filteredWriteOffs = writeOffs.filter(wo =>
        wo.drug_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!selectedAssignmentId) {
        return (
            <div className="text-center py-8 text-gray-500">
                Оберіть локалізацію для перегляду списань
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Списання</h2>
                    <p className="text-sm text-gray-600">Управління списанням медикаментів</p>
                </div>
                <button 
                    onClick={handleOpenModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Нове списання
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Пошук за препаратом..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Препарат
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Кількість
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Користувач
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
                        {filteredWriteOffs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Немає даних про списання
                                </td>
                            </tr>
                        ) : (
                            filteredWriteOffs.map((writeOff) => (
                                <tr key={writeOff.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {writeOff.drug_name || 'Невідомий препарат'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {writeOff.quantity} {writeOff.unit}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {writeOff.user_name || 'Невідомо'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(writeOff.created_at).toLocaleString('uk-UA')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button 
                                            onClick={() => handleDelete(writeOff.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Нове списання</h3>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Препарат
                                </label>
                                <select
                                    value={selectedDrug || ''}
                                    onChange={(e) => setSelectedDrug(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Оберіть препарат</option>
                                    {availableStock.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.drug_name} (доступно: {item.quantity} {item.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Кількість
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={writeOffQuantity}
                                    onChange={(e) => setWriteOffQuantity(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Скасувати
                            </button>
                            <button
                                onClick={handleCreateWriteOff}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                            >
                                Списати
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}