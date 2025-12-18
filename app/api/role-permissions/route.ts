import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

type RolePermissionWithDetails = {
  id: number;
  role_id: number;
  component_id: number;
  operation_id: number;
  role: string;
  component_name: string;
  operations: string;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const roleId = searchParams.get('role_id');

    let permissions: RolePermissionWithDetails[];

    if (roleId) {
      // Get permissions for specific role
      permissions = await sql<RolePermissionWithDetails[]>`
        SELECT 
          rp.id,
          rp.role_id,
          rp.component_id,
          rp.operation_id,
          r.role,
          c.component_name,
          ro.operations
        FROM users.role_permissions rp
        LEFT JOIN users.roles r ON r.id = rp.role_id
        LEFT JOIN users.components c ON c.id = rp.component_id
        LEFT JOIN users.role_operations ro ON ro.id = rp.operation_id
        WHERE rp.role_id = ${Number(roleId)}
        ORDER BY c.component_name, ro.operations
      `;
    } else {
      // Get all permissions
      permissions = await sql<RolePermissionWithDetails[]>`
        SELECT 
          rp.id,
          rp.role_id,
          rp.component_id,
          rp.operation_id,
          r.role,
          c.component_name,
          ro.operations
        FROM users.role_permissions rp
        LEFT JOIN users.roles r ON r.id = rp.role_id
        LEFT JOIN users.components c ON c.id = rp.component_id
        LEFT JOIN users.role_operations ro ON ro.id = rp.operation_id
        ORDER BY r.role, c.component_name, ro.operations
      `;
    }

    // Format the response
    const formattedPermissions = permissions.map(permission => ({
      id: permission.id,
      role_id: permission.role_id,
      component_id: permission.component_id,
      operation_id: permission.operation_id,
      role: { id: permission.role_id, role: permission.role },
      component: { id: permission.component_id, component_name: permission.component_name },
      operation: { id: permission.operation_id, operations: permission.operations }
    }));

    return Response.json(formattedPermissions);
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role_id, component_id, operation_id } = await req.json();

    if (!role_id || !component_id || !operation_id) {
      return Response.json({ 
        error: 'Role ID, component ID, and operation ID are required' 
      }, { status: 400 });
    }

    // Check if permission already exists
    const existing = await sql`
      SELECT id
      FROM users.role_permissions
      WHERE role_id = ${role_id} AND component_id = ${component_id} AND operation_id = ${operation_id}
    `;

    if (existing.length > 0) {
      return Response.json({ 
        error: 'Permission already exists for this role, component, and operation' 
      }, { status: 400 });
    }

    const newPermission = await sql<{id: number, role_id: number, component_id: number, operation_id: number}[]>`
      INSERT INTO users.role_permissions (role_id, component_id, operation_id)
      VALUES (${role_id}, ${component_id}, ${operation_id})
      RETURNING id, role_id, component_id, operation_id
    `;

    // Get the full permission data with joined tables
    const fullPermission = await sql<RolePermissionWithDetails[]>`
      SELECT 
        rp.id,
        rp.role_id,
        rp.component_id,
        rp.operation_id,
        r.role,
        c.component_name,
        ro.operations
      FROM users.role_permissions rp
      LEFT JOIN users.roles r ON r.id = rp.role_id
      LEFT JOIN users.components c ON c.id = rp.component_id
      LEFT JOIN users.role_operations ro ON ro.id = rp.operation_id
      WHERE rp.id = ${newPermission[0].id}
    `;

    const formattedPermission = {
      id: fullPermission[0].id,
      role_id: fullPermission[0].role_id,
      component_id: fullPermission[0].component_id,
      operation_id: fullPermission[0].operation_id,
      role: { id: fullPermission[0].role_id, role: fullPermission[0].role },
      component: { id: fullPermission[0].component_id, component_name: fullPermission[0].component_name },
      operation: { id: fullPermission[0].operation_id, operations: fullPermission[0].operations }
    };

    return Response.json(formattedPermission, { status: 201 });
  } catch (error) {
    console.error('Failed to create permission:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Permission ID is required' }, { status: 400 });
    }

    const { role_id, component_id, operation_id } = await req.json();

    if (!role_id || !component_id || !operation_id) {
      return Response.json({ 
        error: 'Role ID, component ID, and operation ID are required' 
      }, { status: 400 });
    }

    // Check if another permission with same combination exists (excluding current)
    const existing = await sql`
      SELECT id
      FROM users.role_permissions
      WHERE role_id = ${role_id} AND component_id = ${component_id} AND operation_id = ${operation_id} AND id != ${Number(id)}
    `;

    if (existing.length > 0) {
      return Response.json({ 
        error: 'Permission already exists for this role, component, and operation' 
      }, { status: 400 });
    }

    const updatedPermission = await sql<{id: number, role_id: number, component_id: number, operation_id: number}[]>`
      UPDATE users.role_permissions
      SET role_id = ${role_id}, component_id = ${component_id}, operation_id = ${operation_id}
      WHERE id = ${Number(id)}
      RETURNING id, role_id, component_id, operation_id
    `;

    if (updatedPermission.length === 0) {
      return Response.json({ error: 'Permission not found' }, { status: 404 });
    }

    // Get the full permission data with joined tables
    const fullPermission = await sql<RolePermissionWithDetails[]>`
      SELECT 
        rp.id,
        rp.role_id,
        rp.component_id,
        rp.operation_id,
        r.role,
        c.component_name,
        ro.operations
      FROM users.role_permissions rp
      LEFT JOIN users.roles r ON r.id = rp.role_id
      LEFT JOIN users.components c ON c.id = rp.component_id
      LEFT JOIN users.role_operations ro ON ro.id = rp.operation_id
      WHERE rp.id = ${updatedPermission[0].id}
    `;

    const formattedPermission = {
      id: fullPermission[0].id,
      role_id: fullPermission[0].role_id,
      component_id: fullPermission[0].component_id,
      operation_id: fullPermission[0].operation_id,
      role: { id: fullPermission[0].role_id, role: fullPermission[0].role },
      component: { id: fullPermission[0].component_id, component_name: fullPermission[0].component_name },
      operation: { id: fullPermission[0].operation_id, operations: fullPermission[0].operations }
    };

    return Response.json(formattedPermission);
  } catch (error) {
    console.error('Failed to update permission:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Permission ID is required' }, { status: 400 });
    }

    const deletedPermission = await sql<{id: number, role_id: number, component_id: number, operation_id: number}[]>`
      DELETE FROM users.role_permissions
      WHERE id = ${Number(id)}
      RETURNING id, role_id, component_id, operation_id
    `;

    if (deletedPermission.length === 0) {
      return Response.json({ error: 'Permission not found' }, { status: 404 });
    }

    return Response.json({ message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Failed to delete permission:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}