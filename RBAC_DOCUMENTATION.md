# RBAC (Role-Based Access Control) Implementation

## Overview

This Next.js application now includes a comprehensive Role-Based Access Control (RBAC) system that allows you to manage user permissions based on their assigned roles.

## Database Schema

The RBAC system uses existing tables in the `users` schema:

- `users.roles` - Contains roles: admin, doctor, pharmacy_assistant, laboratory_technician, feldsher
- `users.components` - System components/modules (managed via API)
- `users.role_operations` - Available operations (managed via API) 
- `users.role_permissions` - Links roles to component-operation combinations (managed via API)
- `users.role_assignments` - Assigns roles to users (managed via API)

**Note:** Role data is retrieved directly from the Supabase database, not from placeholder files.

## API Endpoints

### Roles Management
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create a new role
- `PUT /api/roles` - Update a role
- `DELETE /api/roles?id=<id>` - Delete a role

### Components Management
- `GET /api/components` - List all components
- `POST /api/components` - Create a new component
- `PUT /api/components` - Update a component
- `DELETE /api/components?id=<id>` - Delete a component

### Operations Management
- `GET /api/operations` - List all operations
- `POST /api/operations` - Create a new operation
- `PUT /api/operations` - Update an operation
- `DELETE /api/operations?id=<id>` - Delete an operation

### Permissions Management
- `GET /api/role-permissions` - List all permissions
- `GET /api/role-permissions?role_id=<id>` - List permissions for specific role
- `POST /api/role-permissions` - Create a new permission
- `DELETE /api/role-permissions?id=<id>` - Delete a permission

### Role Assignments
- `GET /api/role-assignments` - List all role assignments
- `GET /api/role-assignments?user_id=<id>` - List assignments for specific user
- `POST /api/role-assignments` - Assign role to user
- `DELETE /api/role-assignments?id=<id>` - Remove role assignment

### User Permissions
- `GET /api/user-permissions` - Get permissions for current authenticated user

## Client-Side Usage

### RBACProvider Context

Wrap your app with `RBACProvider` to provide RBAC context:

```tsx
import { RBACProvider } from '@/app/ui/rbac/rbac-provider';

export default function Layout({ children }) {
  return (
    <RBACProvider>
      {children}
    </RBACProvider>
  );
}
```

### useRBAC Hook

Access RBAC functionality in your components:

```tsx
import { useRBAC } from '@/app/ui/rbac/rbac-provider';

function MyComponent() {
  const { hasPermission, hasRole, permissions, isLoading } = useRBAC();

  if (hasPermission('patients', 'create')) {
    // Show create button
  }

  if (hasRole('admin')) {
    // Show admin features
  }

  return <div>...</div>;
}
```

### Permission Gates

Use permission gates to conditionally render components:

```tsx
import { PermissionGate, RoleGate } from '@/app/ui/rbac/rbac-provider';

// Show content only if user has specific permission
<PermissionGate component="patients" operation="create">
  <CreatePatientButton />
</PermissionGate>

// Show content only if user has specific role
<RoleGate role="admin">
  <AdminPanel />
</RoleGate>

// Show content if user has ANY of the specified permissions
<AnyPermissionGate permissions={[
  { component: 'patients', operation: 'read' },
  { component: 'visits', operation: 'read' }
]}>
  <PatientVisitsSummary />
</AnyPermissionGate>

// Show content only if user has ALL specified permissions
<AllPermissionsGate permissions={[
  { component: 'pharmacy', operation: 'read' },
  { component: 'pharmacy', operation: 'dispense' }
]}>
  <PharmacyDispenseInterface />
</AllPermissionsGate>
```

## Server-Side Usage

### Permission Checking Functions

```tsx
import { 
  hasPermission, 
  hasRole, 
  getUserPermissions,
  currentUserHasPermission 
} from '@/app/lib/rbac';

// Check if specific user has permission
const canEdit = await hasPermission(userId, 'patients', 'update');

// Check if current authenticated user has permission
const canCreate = await currentUserHasPermission('visits', 'create');

// Check if user has specific role
const isAdmin = await hasRole(userId, 'admin');

// Get all permissions for a user
const permissions = await getUserPermissions(userId);
```

### Route Protection with Middleware

```tsx
import { withPermission, withRole } from '@/app/lib/rbac-middleware';

// Protect route with permission requirement
export const GET = withPermission('patients', 'read', async (req) => {
  // This code only runs if user has patients:read permission
  const patients = await fetchPatients();
  return Response.json(patients);
});

// Protect route with role requirement
export const POST = withRole('admin', async (req) => {
  // This code only runs if user has admin role
  const data = await req.json();
  // ... handle admin operation
});
```

## Admin Interface

Access the admin interface at `/dashboard/admin/roles` (requires admin role).

The admin interface allows you to:
- Create and manage roles
- Create and manage components
- Create and manage operations
- Assign permissions to roles
- View user role assignments

## Default Setup

The system comes with these default roles:

1. **admin** - Full access to all system features including user management
2. **doctor** - Can manage patients, visits, prescriptions, and diagnoses
3. **pharmacy_assistant** - Can manage pharmacy stock, dispense medications, and process invoices
4. **laboratory_technician** - Can manage laboratory tests and results
5. **feldsher** - Medical assistant with permissions for basic patient care and procedures

## Security Notes

- All API endpoints require authentication
- Permission checks are performed on both client and server
- Client-side gates are for UX only - server-side validation is mandatory
- Users register through Supabase authentication system

## Extending the System

### Adding New Components
1. Add component via admin interface or API
2. Create permissions for the new component
3. Assign permissions to appropriate roles

### Adding New Operations
1. Add operation via admin interface or API
2. Create permissions using the new operation
3. Update your code to use the new permission checks

### Custom Permission Logic
You can extend the RBAC system with custom business logic by modifying the utility functions in `/app/lib/rbac.ts`.