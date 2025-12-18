import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('user_id');

    let assignments;

    if (userId) {
      assignments = await sql`
        SELECT 
          la.id,
          la.user_id,
          la.locals_id,
          la.created_at,
          u.user_name,
          l.organization_id,
          l.department_id,
          l.room_id,
          o.organization_name,
          d.department_name,
          r.room_name
        FROM users.local_assignments la
        LEFT JOIN users.users u ON la.user_id = u.user_id
        LEFT JOIN users.locals l ON la.locals_id = l.id
        LEFT JOIN users.organizations o ON l.organization_id = o.id
        LEFT JOIN users.departments d ON l.department_id = d.id
        LEFT JOIN users.rooms r ON l.room_id = r.id
        WHERE la.user_id = ${userId}
        ORDER BY o.organization_name, d.department_name, r.room_name
      `;
    } else {
      assignments = await sql`
        SELECT 
          la.id,
          la.user_id,
          la.locals_id,
          la.created_at,
          u.user_name,
          l.organization_id,
          l.department_id,
          l.room_id,
          o.organization_name,
          d.department_name,
          r.room_name
        FROM users.local_assignments la
        LEFT JOIN users.users u ON la.user_id = u.user_id
        LEFT JOIN users.locals l ON la.locals_id = l.id
        LEFT JOIN users.organizations o ON l.organization_id = o.id
        LEFT JOIN users.departments d ON l.department_id = d.id
        LEFT JOIN users.rooms r ON l.room_id = r.id
        ORDER BY o.organization_name, d.department_name, r.room_name
      `;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedAssignments = assignments.map((assignment: any) => ({
      id: assignment.id,
      user_id: assignment.user_id,
      user_name: assignment.user_name,
      locals_id: assignment.locals_id,
      created_at: assignment.created_at,
      local: assignment.locals_id ? {
        id: assignment.locals_id,
        organization_id: assignment.organization_id,
        department_id: assignment.department_id,
        room_id: assignment.room_id,
        organization: { id: assignment.organization_id, organization_name: assignment.organization_name },
        department: assignment.department_id ? { id: assignment.department_id, department_name: assignment.department_name } : undefined,
        room: assignment.room_id ? { id: assignment.room_id, room_name: assignment.room_name } : undefined
      } : undefined
    }));

    return Response.json(formattedAssignments);
  } catch (error) {
    console.error('Failed to fetch local assignments:', error);
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

    const { user_id, locals_id } = await req.json();

    if (!user_id || !locals_id) {
      return Response.json({ 
        error: 'User ID and locals ID are required' 
      }, { status: 400 });
    }

    // Check if assignment already exists
    const existing = await sql`
      SELECT id
      FROM users.local_assignments
      WHERE user_id = ${user_id} AND locals_id = ${locals_id}
    `;

    if (existing.length > 0) {
      return Response.json({ 
        error: 'User already has this local assigned' 
      }, { status: 400 });
    }

    const newAssignment = await sql`
      INSERT INTO users.local_assignments (user_id, locals_id)
      VALUES (${user_id}, ${locals_id})
      RETURNING id, user_id, locals_id, created_at
    `;

    // Get full data with joined tables
    const fullAssignment = await sql`
      SELECT 
        la.id,
        la.user_id,
        la.locals_id,
        la.created_at,
        u.user_name,
        l.organization_id,
        l.department_id,
        l.room_id,
        o.organization_name,
        d.department_name,
        r.room_name
      FROM users.local_assignments la
      LEFT JOIN users.users u ON la.user_id = u.user_id
      LEFT JOIN users.locals l ON la.locals_id = l.id
      LEFT JOIN users.organizations o ON l.organization_id = o.id
      LEFT JOIN users.departments d ON l.department_id = d.id
      LEFT JOIN users.rooms r ON l.room_id = r.id
      WHERE la.id = ${newAssignment[0].id}
    `;

    const formatted = {
      id: fullAssignment[0].id,
      user_id: fullAssignment[0].user_id,
      user_name: fullAssignment[0].user_name,
      locals_id: fullAssignment[0].locals_id,
      created_at: fullAssignment[0].created_at,
      local: {
        id: fullAssignment[0].locals_id,
        organization_id: fullAssignment[0].organization_id,
        department_id: fullAssignment[0].department_id,
        room_id: fullAssignment[0].room_id,
        organization: { id: fullAssignment[0].organization_id, organization_name: fullAssignment[0].organization_name },
        department: fullAssignment[0].department_id ? { id: fullAssignment[0].department_id, department_name: fullAssignment[0].department_name } : undefined,
        room: fullAssignment[0].room_id ? { id: fullAssignment[0].room_id, room_name: fullAssignment[0].room_name } : undefined
      }
    };

    return Response.json(formatted, { status: 201 });
  } catch (error) {
    console.error('Failed to create local assignment:', error);
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
      return Response.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    const { user_id, locals_id } = await req.json();

    if (!user_id || !locals_id) {
      return Response.json({ 
        error: 'User ID and locals ID are required' 
      }, { status: 400 });
    }

    // Check if another assignment with same user_id and locals_id exists (excluding current)
    const existing = await sql`
      SELECT id
      FROM users.local_assignments
      WHERE user_id = ${user_id} AND locals_id = ${locals_id} AND id != ${Number(id)}
    `;

    if (existing.length > 0) {
      return Response.json({ 
        error: 'User already has this local assigned' 
      }, { status: 400 });
    }

    const updatedAssignment = await sql`
      UPDATE users.local_assignments
      SET user_id = ${user_id}, locals_id = ${locals_id}
      WHERE id = ${Number(id)}
      RETURNING id, user_id, locals_id, created_at
    `;

    if (updatedAssignment.length === 0) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Get full data with joined tables
    const fullAssignment = await sql`
      SELECT 
        la.id,
        la.user_id,
        la.locals_id,
        la.created_at,
        u.user_name,
        l.organization_id,
        l.department_id,
        l.room_id,
        o.organization_name,
        d.department_name,
        r.room_name
      FROM users.local_assignments la
      LEFT JOIN users.users u ON la.user_id = u.user_id
      LEFT JOIN users.locals l ON la.locals_id = l.id
      LEFT JOIN users.organizations o ON l.organization_id = o.id
      LEFT JOIN users.departments d ON l.department_id = d.id
      LEFT JOIN users.rooms r ON l.room_id = r.id
      WHERE la.id = ${updatedAssignment[0].id}
    `;

    const formatted = {
      id: fullAssignment[0].id,
      user_id: fullAssignment[0].user_id,
      user_name: fullAssignment[0].user_name,
      locals_id: fullAssignment[0].locals_id,
      created_at: fullAssignment[0].created_at,
      local: {
        id: fullAssignment[0].locals_id,
        organization_id: fullAssignment[0].organization_id,
        department_id: fullAssignment[0].department_id,
        room_id: fullAssignment[0].room_id,
        organization: { id: fullAssignment[0].organization_id, organization_name: fullAssignment[0].organization_name },
        department: fullAssignment[0].department_id ? { id: fullAssignment[0].department_id, department_name: fullAssignment[0].department_name } : undefined,
        room: fullAssignment[0].room_id ? { id: fullAssignment[0].room_id, room_name: fullAssignment[0].room_name } : undefined
      }
    };

    return Response.json(formatted);
  } catch (error) {
    console.error('Failed to update local assignment:', error);
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

    const deletedAssignment = await sql`
      DELETE FROM users.local_assignments
      WHERE id = ${Number(id)}
      RETURNING id, user_id, locals_id
    `;

    if (deletedAssignment.length === 0) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return Response.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete local assignment:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
