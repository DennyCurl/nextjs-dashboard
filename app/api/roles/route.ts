import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Role } from '@/app/lib/definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await sql<Role[]>`
      SELECT id, role
      FROM users.roles
      ORDER BY role ASC
    `;

    return Response.json(roles);
  } catch (error) {
    console.error('Failed to fetch roles:', error);
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

    const { role } = await req.json();

    if (!role || role.trim() === '') {
      return Response.json({ error: 'Role name is required' }, { status: 400 });
    }

    const newRole = await sql<Role[]>`
      INSERT INTO users.roles (role)
      VALUES (${role.trim()})
      RETURNING id, role
    `;

    return Response.json(newRole[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create role:', error);
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

    const { id, role } = await req.json();

    if (!id || !role || role.trim() === '') {
      return Response.json({ error: 'Role ID and name are required' }, { status: 400 });
    }

    const updatedRole = await sql<Role[]>`
      UPDATE users.roles
      SET role = ${role.trim()}
      WHERE id = ${id}
      RETURNING id, role
    `;

    if (updatedRole.length === 0) {
      return Response.json({ error: 'Role not found' }, { status: 404 });
    }

    return Response.json(updatedRole[0]);
  } catch (error) {
    console.error('Failed to update role:', error);
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
      return Response.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Check if role is assigned to any users
    const assignments = await sql`
      SELECT COUNT(*) as count
      FROM users.role_assignments
      WHERE role_id = ${Number(id)}
    `;

    if (assignments[0].count > 0) {
      return Response.json({ 
        error: 'Cannot delete role that is assigned to users' 
      }, { status: 400 });
    }

    // Check if role has any permissions
    const permissions = await sql`
      SELECT COUNT(*) as count
      FROM users.role_permissions
      WHERE role_id = ${Number(id)}
    `;

    if (permissions[0].count > 0) {
      return Response.json({ 
        error: 'Cannot delete role that has permissions assigned' 
      }, { status: 400 });
    }

    const deletedRole = await sql<Role[]>`
      DELETE FROM users.roles
      WHERE id = ${Number(id)}
      RETURNING id, role
    `;

    if (deletedRole.length === 0) {
      return Response.json({ error: 'Role not found' }, { status: 404 });
    }

    return Response.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Failed to delete role:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}