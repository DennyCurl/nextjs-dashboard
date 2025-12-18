'use client';

import dynamic from 'next/dynamic';

const PharmacyBaseTable = dynamic(() => import('@/app/ui/pharmacy/base-table'), {
    ssr: false,
    loading: () => (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 h-10 bg-gray-50 animate-pulse"></div>
                </div>
                <div className="sm:w-48">
                    <div className="w-full rounded-lg border border-gray-300 py-2 px-3 h-10 bg-gray-50 animate-pulse"></div>
                </div>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <div className="min-w-full h-64 bg-gray-50 animate-pulse"></div>
            </div>
        </div>
    )
});

export default function PharmacyTableWrapper() {
    return <PharmacyBaseTable />;
}