import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

type RoleAssignmentWithDetails = {
  id: number;
  user_id: string;
  role_id: number;
  role: string;
  user_name?: string;
  user_email?: string;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('user_id');

    let assignments: RoleAssignmentWithDetails[];

    if (userId) {
      assignments = await sql<RoleAssignmentWithDetails[]>`
        SELECT 
          ra.id,
          ra.user_id,
          ra.role_id,
          r.role,
          u.user_name as user_name,
          au.email as user_email
        FROM users.role_assignments ra
        LEFT JOIN users.roles r ON r.id = ra.role_id
        LEFT JOIN users.users u ON u.user_id = ra.user_id
        LEFT JOIN auth.users au ON au.id = ra.user_id
        WHERE ra.user_id = ${userId}
        ORDER BY r.role
      `;
    } else {
      assignments = await sql<RoleAssignmentWithDetails[]>`
        SELECT 
          ra.id,
          ra.user_id,
          ra.role_id,
          r.role,
          u.user_name as user_name,
          au.email as user_email
        FROM users.role_assignments ra
        LEFT JOIN users.roles r ON r.id = ra.role_id
        LEFT JOIN users.users u ON u.user_id = ra.user_id
        LEFT JOIN auth.users au ON au.id = ra.user_id
        ORDER BY au.email, r.role
      `;
    }

    // Format the response
    const formattedAssignments = assignments.map(assignment => ({
      id: assignment.id,
      user_id: assignment.user_id,
      role_id: assignment.role_id,
      role: { id: assignment.role_id, role: assignment.role },
      user: { 
        id: assignment.user_id, 
        name: assignment.user_name || assignment.user_email || 'Unknown',
        email: assignment.user_email 
      }
    }));

    return Response.json(formattedAssignments);
  } catch (error) {
    console.error('Failed to fetch role assignments:', error);
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

    const { user_id, role_id } = await req.json();

    if (!user_id || !role_id) {
      return Response.json({ 
        error: 'User ID and role ID are required' 
      }, { status: 400 });
    }

    // Check if assignment already exists
    const existing = await sql`
      SELECT id
      FROM users.role_assignments
      WHERE user_id = ${user_id} AND role_id = ${role_id}
    `;

    if (existing.length > 0) {
      return Response.json({ 
        error: 'User already has this role assigned' 
      }, { status: 400 });
    }

    const newAssignment = await sql<{id: number, user_id: string, role_id: number}[]>`
      INSERT INTO users.role_assignments (user_id, role_id)
      VALUES (${user_id}, ${role_id})
      RETURNING id, user_id, role_id
    `;

    // Get the full assignment data with joined tables
    const fullAssignment = await sql<RoleAssignmentWithDetails[]>`
      SELECT 
        ra.id,
        ra.user_id,
        ra.role_id,
        r.role,
        u.user_name as user_name,
        au.email as user_email
      FROM users.role_assignments ra
      LEFT JOIN users.roles r ON r.id = ra.role_id
      LEFT JOIN users.users u ON u.user_id = ra.user_id
      LEFT JOIN auth.users au ON au.id = ra.user_id
      WHERE ra.id = ${newAssignment[0].id}
    `;

    const formattedAssignment = {
      id: fullAssignment[0].id,
      user_id: fullAssignment[0].user_id,
      role_id: fullAssignment[0].role_id,
      role: { id: fullAssignment[0].role_id, role: fullAssignment[0].role },
      user: { 
        id: fullAssignment[0].user_id, 
        name: fullAssignment[0].user_name || fullAssignment[0].user_email || 'Unknown',
        email: fullAssignment[0].user_email 
      }
    };

    return Response.json(formattedAssignment, { status: 201 });
  } catch (error) {
    console.error('Failed to create role assignment:', error);
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
      return Response.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const deletedAssignment = await sql<{id: number, user_id: string, role_id: number}[]>`
      DELETE FROM users.role_assignments
      WHERE id = ${Number(id)}
      RETURNING id, user_id, role_id
    `;

    if (deletedAssignment.length === 0) {
      return Response.json({ error: 'Role assignment not found' }, { status: 404 });
    }

    return Response.json({ message: 'Role assignment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete role assignment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}