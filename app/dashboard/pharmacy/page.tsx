import { Metadata } from 'next';
import PharmacyTabs from '@/app/ui/pharmacy/pharmacy-tabs';

export const metadata: Metadata = {
    title: 'Аптека | Управління медикаментами',
};

export default function PharmacyPage() {
    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Управління аптекою</h1>
            </div>

            <PharmacyTabs />
        </div>
    );
}
