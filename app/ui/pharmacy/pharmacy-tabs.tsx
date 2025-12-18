'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DocumentTextIcon, CubeIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';
import PharmacyTableWrapper from './table-wrapper';
import InvoicesWrapper from './invoices-wrapper';
import StockWrapper from './stock-wrapper';
import WriteOffsWrapper from './write-offs-wrapper';

const tabs = [
    {
        id: 'base',
        name: 'База медикаментів',
        icon: BeakerIcon,
        component: PharmacyTableWrapper,
    },
    {
        id: 'invoices',
        name: 'Накладні',
        icon: DocumentTextIcon,
        component: InvoicesWrapper,
    },
    {
        id: 'stock',
        name: 'Залишки',
        icon: CubeIcon,
        component: StockWrapper,
    },
    {
        id: 'writeoffs',
        name: 'Списання',
        icon: TrashIcon,
        component: WriteOffsWrapper,
    },
];

export default function PharmacyTabs() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [activeTab, setActiveTab] = useState(() => {
        return searchParams.get('tab') || 'base';
    });

    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabs.some(tab => tab.id === tabFromUrl)) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams]);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        const params = new URLSearchParams(searchParams);
        params.set('tab', tabId);
        router.replace(`${pathname}?${params.toString()}`);
    };

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PharmacyTableWrapper;

    return (
        <div className="w-full">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm
                                    ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                            >
                                <Icon
                                    className={`
                                        -ml-0.5 mr-2 h-5 w-5
                                        ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                                    `}
                                />
                                {tab.name}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                <ActiveComponent />
            </div>
        </div>
    );
}