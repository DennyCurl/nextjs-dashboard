import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const departments = await sql`
      SELECT id, department_name, created_at
      FROM users.departments
      ORDER BY department_name
    `;

    return Response.json(departments);
  } catch (error) {
    console.error('Failed to fetch departments:', error);
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

    const { department_name } = await req.json();

    if (!department_name) {
      return Response.json({ 
        error: 'Department name is required' 
      }, { status: 400 });
    }

    const newDepartment = await sql`
      INSERT INTO users.departments (department_name)
      VALUES (${department_name})
      RETURNING id, department_name, created_at
    `;

    return Response.json(newDepartment[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create department:', error);
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
      return Response.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const deletedDepartment = await sql`
      DELETE FROM users.departments
      WHERE id = ${Number(id)}
      RETURNING id, department_name
    `;

    if (deletedDepartment.length === 0) {
      return Response.json({ error: 'Department not found' }, { status: 404 });
    }

    return Response.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Failed to delete department:', error);
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

    const { id, department_name } = await req.json();

    if (!id || !department_name) {
      return Response.json({ 
        error: 'Department ID and name are required' 
      }, { status: 400 });
    }

    const updatedDepartment = await sql`
      UPDATE users.departments
      SET department_name = ${department_name}
      WHERE id = ${Number(id)}
      RETURNING id, department_name, created_at
    `;

    if (updatedDepartment.length === 0) {
      return Response.json({ error: 'Department not found' }, { status: 404 });
    }

    return Response.json(updatedDepartment[0]);
  } catch (error) {
    console.error('Failed to update department:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
