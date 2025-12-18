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

    const locals = await sql`
      SELECT 
        l.id,
        l.organization_id,
        l.department_id,
        l.room_id,
        o.organization_name,
        d.department_name,
        r.room_name
      FROM users.locals l
      LEFT JOIN users.organizations o ON l.organization_id = o.id
      LEFT JOIN users.departments d ON l.department_id = d.id
      LEFT JOIN users.rooms r ON l.room_id = r.id
      ORDER BY o.organization_name, d.department_name, r.room_name
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedLocals = locals.map((local: any) => ({
      id: local.id,
      organization_id: local.organization_id,
      department_id: local.department_id,
      room_id: local.room_id,
      organization: { id: local.organization_id, organization_name: local.organization_name },
      department: local.department_id ? { id: local.department_id, department_name: local.department_name } : undefined,
      room: local.room_id ? { id: local.room_id, room_name: local.room_name } : undefined
    }));

    return Response.json(formattedLocals);
  } catch (error) {
    console.error('Failed to fetch locals:', error);
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

    const { organization_id, department_id, room_id } = await req.json();

    if (!organization_id) {
      return Response.json({ 
        error: 'Organization ID is required' 
      }, { status: 400 });
    }

    const newLocal = await sql`
      INSERT INTO users.locals (organization_id, department_id, room_id)
      VALUES (${organization_id}, ${department_id || null}, ${room_id || null})
      RETURNING id, organization_id, department_id, room_id
    `;

    // Get full data with joined tables
    const fullLocal = await sql`
      SELECT 
        l.id,
        l.organization_id,
        l.department_id,
        l.room_id,
        o.organization_name,
        d.department_name,
        r.room_name
      FROM users.locals l
      LEFT JOIN users.organizations o ON l.organization_id = o.id
      LEFT JOIN users.departments d ON l.department_id = d.id
      LEFT JOIN users.rooms r ON l.room_id = r.id
      WHERE l.id = ${newLocal[0].id}
    `;

    const formatted = {
      id: fullLocal[0].id,
      organization_id: fullLocal[0].organization_id,
      department_id: fullLocal[0].department_id,
      room_id: fullLocal[0].room_id,
      organization: { id: fullLocal[0].organization_id, organization_name: fullLocal[0].organization_name },
      department: fullLocal[0].department_id ? { id: fullLocal[0].department_id, department_name: fullLocal[0].department_name } : undefined,
      room: fullLocal[0].room_id ? { id: fullLocal[0].room_id, room_name: fullLocal[0].room_name } : undefined
    };

    return Response.json(formatted, { status: 201 });
  } catch (error) {
    console.error('Failed to create local:', error);
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
      return Response.json({ error: 'Local ID is required' }, { status: 400 });
    }

    const deletedLocal = await sql`
      DELETE FROM users.locals
      WHERE id = ${Number(id)}
      RETURNING id, organization_id, department_id, room_id
    `;

    if (deletedLocal.length === 0) {
      return Response.json({ error: 'Local not found' }, { status: 404 });
    }

    return Response.json({ message: 'Local deleted successfully' });
  } catch (error) {
    console.error('Failed to delete local:', error);
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

    const { id, organization_id, department_id, room_id } = await req.json();

    if (!id || !organization_id) {
      return Response.json({ 
        error: 'Local ID and organization ID are required' 
      }, { status: 400 });
    }

    const updatedLocal = await sql`
      UPDATE users.locals
      SET 
        organization_id = ${organization_id},
        department_id = ${department_id || null},
        room_id = ${room_id || null}
      WHERE id = ${Number(id)}
      RETURNING id, organization_id, department_id, room_id
    `;

    if (updatedLocal.length === 0) {
      return Response.json({ error: 'Local not found' }, { status: 404 });
    }

    // Get full data with joined tables
    const fullLocal = await sql`
      SELECT 
        l.id,
        l.organization_id,
        l.department_id,
        l.room_id,
        o.organization_name,
        d.department_name,
        r.room_name
      FROM users.locals l
      LEFT JOIN users.organizations o ON l.organization_id = o.id
      LEFT JOIN users.departments d ON l.department_id = d.id
      LEFT JOIN users.rooms r ON l.room_id = r.id
      WHERE l.id = ${updatedLocal[0].id}
    `;

    const formatted = {
      id: fullLocal[0].id,
      organization_id: fullLocal[0].organization_id,
      department_id: fullLocal[0].department_id,
      room_id: fullLocal[0].room_id,
      organization: { id: fullLocal[0].organization_id, organization_name: fullLocal[0].organization_name },
      department: fullLocal[0].department_id ? { id: fullLocal[0].department_id, department_name: fullLocal[0].department_name } : undefined,
      room: fullLocal[0].room_id ? { id: fullLocal[0].room_id, room_name: fullLocal[0].room_name } : undefined
    };

    return Response.json(formatted);
  } catch (error) {
    console.error('Failed to update local:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
