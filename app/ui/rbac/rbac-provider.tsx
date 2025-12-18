'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserPermissions } from '@/app/lib/definitions';
import type { User } from '@supabase/supabase-js';

type RBACContextType = {
  permissions: UserPermissions;
  hasPermission: (component: string, operation: string) => boolean;
  hasRole: (role: string) => boolean;
  isLoading: boolean;
  user: User | null;
};

const RBACContext = createContext<RBACContextType>({
  permissions: {},
  hasPermission: () => false,
  hasRole: () => false,
  isLoading: true,
  user: null,
});

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();

    const loadUserPermissions = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setIsLoading(false);
          return;
        }

        setUser(user);

        // Fetch user permissions
        const permissionsResponse = await fetch('/api/user-permissions');
        if (permissionsResponse.ok) {
          const userPermissions = await permissionsResponse.json();
          setPermissions(userPermissions);
        }

        // Fetch user roles
        const rolesResponse = await fetch(`/api/role-assignments?user_id=${user.id}`);
        if (rolesResponse.ok) {
          const assignments = await rolesResponse.json();
          const roles = assignments.map((assignment: {role: {role: string}}) => assignment.role.role);
          setUserRoles(roles);
        }

        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    };

    loadUserPermissions();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        loadUserPermissions();
      } else if (event === 'SIGNED_OUT') {
        setPermissions({});
        setUserRoles([]);
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (component: string, operation: string): boolean => {
    if (!permissions[component]) return false;
    return permissions[component].includes(operation);
  };

  const hasRole = (role: string): boolean => {
    return userRoles.includes(role);
  };

  return (
    <RBACContext.Provider 
      value={{
        permissions,
        hasPermission,
        hasRole,
        isLoading,
        user,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
}

// Permission Gate Component
type PermissionGateProps = {
  component: string;
  operation: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PermissionGate({ 
  component, 
  operation, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission, isLoading } = useRBAC();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasPermission(component, operation)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Role Gate Component
type RoleGateProps = {
  role: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleGate({ 
  role, 
  children, 
  fallback = null 
}: RoleGateProps) {
  const { hasRole, isLoading } = useRBAC();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Multiple Permissions Gate (ANY)
type AnyPermissionGateProps = {
  permissions: Array<{ component: string; operation: string }>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AnyPermissionGate({ 
  permissions, 
  children, 
  fallback = null 
}: AnyPermissionGateProps) {
  const { hasPermission, isLoading } = useRBAC();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const hasAnyPermission = permissions.some(({ component, operation }) =>
    hasPermission(component, operation)
  );

  if (!hasAnyPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Multiple Permissions Gate (ALL)
type AllPermissionsGateProps = {
  permissions: Array<{ component: string; operation: string }>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function AllPermissionsGate({ 
  permissions, 
  children, 
  fallback = null 
}: AllPermissionsGateProps) {
  const { hasPermission, isLoading } = useRBAC();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const hasAllPermissions = permissions.every(({ component, operation }) =>
    hasPermission(component, operation)
  );

  if (!hasAllPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}