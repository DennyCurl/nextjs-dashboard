import { Suspense } from 'react';
import { fetchRoles } from '@/app/lib/data';
import { RoleGate } from '@/app/ui/rbac/rbac-provider';
import RoleManagement from '@/app/ui/admin/role-management';

export default async function AdminRolesPage() {
  const roles = await fetchRoles();

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
          <h1 className="text-2xl font-bold">Керування ролями та дозволами</h1>
        </div>
        
        <Suspense fallback={<div>Завантаження...</div>}>
          <RoleManagement roles={roles} />
        </Suspense>
      </div>
    </RoleGate>
  );
}