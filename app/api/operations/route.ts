import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { RoleOperation } from '@/app/lib/definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const operations = await sql<RoleOperation[]>`
      SELECT id, operations
      FROM users.role_operations
      ORDER BY operations ASC
    `;

    return Response.json(operations);
  } catch (error) {
    console.error('Failed to fetch operations:', error);
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

    const { operations } = await req.json();

    if (!operations || operations.trim() === '') {
      return Response.json({ error: 'Operation name is required' }, { status: 400 });
    }

    const newOperation = await sql<RoleOperation[]>`
      INSERT INTO users.role_operations (operations)
      VALUES (${operations.trim()})
      RETURNING id, operations
    `;

    return Response.json(newOperation[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create operation:', error);
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

    const { id, operations } = await req.json();

    if (!id || !operations || operations.trim() === '') {
      return Response.json({ error: 'Operation ID and name are required' }, { status: 400 });
    }

    const updatedOperation = await sql<RoleOperation[]>`
      UPDATE users.role_operations
      SET operations = ${operations.trim()}
      WHERE id = ${id}
      RETURNING id, operations
    `;

    if (updatedOperation.length === 0) {
      return Response.json({ error: 'Operation not found' }, { status: 404 });
    }

    return Response.json(updatedOperation[0]);
  } catch (error) {
    console.error('Failed to update operation:', error);
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
      return Response.json({ error: 'Operation ID is required' }, { status: 400 });
    }

    // Check if operation has any permissions
    const permissions = await sql`
      SELECT COUNT(*) as count
      FROM users.role_permissions
      WHERE operation_id = ${Number(id)}
    `;

    if (permissions[0].count > 0) {
      return Response.json({ 
        error: 'Cannot delete operation that has permissions assigned' 
      }, { status: 400 });
    }

    const deletedOperation = await sql<RoleOperation[]>`
      DELETE FROM users.role_operations
      WHERE id = ${Number(id)}
      RETURNING id, operations
    `;

    if (deletedOperation.length === 0) {
      return Response.json({ error: 'Operation not found' }, { status: 404 });
    }

    return Response.json({ message: 'Operation deleted successfully' });
  } catch (error) {
    console.error('Failed to delete operation:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}