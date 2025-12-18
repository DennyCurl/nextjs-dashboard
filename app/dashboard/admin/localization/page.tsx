import { Suspense } from 'react';
import { RoleGate } from '@/app/ui/rbac/rbac-provider';
import LocalizationManagement from '@/app/ui/admin/localization-management';

export default async function AdminLocalizationPage() {
  return (
    <RoleGate role="admin" fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Доступ заборонено</h1>
          <p className="text-gray-600">Потрібна роль адміністратора для доступу до цієї сторінки.</p>
        </div>
      </div>
    }>
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Керування локалізацією</h1>
        </div>
        
        <Suspense fallback={<div>Завантаження...</div>}>
          <LocalizationManagement />
        </Suspense>
      </div>
    </RoleGate>
  );
}
