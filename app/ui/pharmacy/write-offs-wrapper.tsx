'use client';

import dynamic from 'next/dynamic';

const WriteOffsTab = dynamic(() => import('./write-offs-tab'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    )
});

export default WriteOffsTab;