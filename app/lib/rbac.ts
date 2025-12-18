import postgres from 'postgres';
import { createClient } from '@/utils/supabase/server';
import { UserPermissions, PermissionCheck } from './definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

/**
 * Get all permissions for a user by user ID
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  try {
    const permissions = await sql<{
      component_name: string;
      operations: string;
    }[]>`
      SELECT 
        c.component_name,
        ro.operations
      FROM users.role_assignments ra
      JOIN users.role_permissions rp ON rp.role_id = ra.role_id
      JOIN users.components c ON c.id = rp.component_id
      JOIN users.role_operations ro ON ro.id = rp.operation_id
      WHERE ra.user_id = ${userId}
    `;

    // Group permissions by component
    const userPermissions: UserPermissions = {};
    
    permissions.forEach(permission => {
      if (!userPermissions[permission.component_name]) {
        userPermissions[permission.component_name] = [];
      }
      
      if (!userPermissions[permission.component_name].includes(permission.operations)) {
        userPermissions[permission.component_name].push(permission.operations);
      }
    });

    return userPermissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return {};
  }
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string, 
  component: string, 
  operation: string
): Promise<boolean> {
  try {
    const result = await sql<{count: number}[]>`
      SELECT COUNT(*) as count
      FROM users.role_assignments ra
      JOIN users.role_permissions rp ON rp.role_id = ra.role_id
      JOIN users.components c ON c.id = rp.component_id
      JOIN users.role_operations ro ON ro.id = rp.operation_id
      WHERE ra.user_id = ${userId}
        AND c.component_name = ${component}
        AND ro.operations = ${operation}
    `;

    return result[0].count > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(
  userId: string,
  permissions: PermissionCheck[]
): Promise<boolean> {
  if (!permissions.length) return false;

  try {
    const conditions = permissions.map((_, index) => 
      `(c.component_name = $${index * 2 + 2} AND ro.operations = $${index * 2 + 3})`
    ).join(' OR ');

    const values = [userId];
    permissions.forEach(permission => {
      values.push(permission.component, permission.operation);
    });

    const query = `
      SELECT COUNT(*) as count
      FROM users.role_assignments ra
      JOIN users.role_permissions rp ON rp.role_id = ra.role_id
      JOIN users.components c ON c.id = rp.component_id
      JOIN users.role_operations ro ON ro.id = rp.operation_id
      WHERE ra.user_id = $1 AND (${conditions})
    `;

    const result = await sql.unsafe(query, values);
    return Number(result[0].count) > 0;
  } catch (error) {
    console.error('Error checking any permission:', error);
    return false;
  }
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(
  userId: string,
  permissions: PermissionCheck[]
): Promise<boolean> {
  if (!permissions.length) return true;

  try {
    const permissionChecks = await Promise.all(
      permissions.map(permission => 
        hasPermission(userId, permission.component, permission.operation)
      )
    );

    return permissionChecks.every(hasPermission => hasPermission);
  } catch (error) {
    console.error('Error checking all permissions:', error);
    return false;
  }
}

/**
 * Get current user permissions (uses Supabase auth)
 */
export async function getCurrentUserPermissions(): Promise<UserPermissions> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {};
    }

    return await getUserPermissions(user.id);
  } catch (error) {
    console.error('Error getting current user permissions:', error);
    return {};
  }
}

/**
 * Check if current user has specific permission
 */
export async function currentUserHasPermission(
  component: string, 
  operation: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    return await hasPermission(user.id, component, operation);
  } catch (error) {
    console.error('Error checking current user permission:', error);
    return false;
  }
}

/**
 * Get user roles by user ID
 */
export async function getUserRoles(userId: string) {
  try {
    const roles = await sql<{
      id: number;
      role_id: number;
      role: string;
    }[]>`
      SELECT 
        ra.id,
        ra.role_id,
        r.role
      FROM users.role_assignments ra
      JOIN users.roles r ON r.id = ra.role_id
      WHERE ra.user_id = ${userId}
      ORDER BY r.role
    `;

    return roles;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

/**
 * Check if user has specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const result = await sql<{count: number}[]>`
      SELECT COUNT(*) as count
      FROM users.role_assignments ra
      JOIN users.roles r ON r.id = ra.role_id
      WHERE ra.user_id = ${userId} AND r.role = ${roleName}
    `;

    return result[0].count > 0;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Check if current user has specific role
 */
export async function currentUserHasRole(roleName: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return false;
    }

    return await hasRole(user.id, roleName);
  } catch (error) {
    console.error('Error checking current user role:', error);
    return false;
  }
}