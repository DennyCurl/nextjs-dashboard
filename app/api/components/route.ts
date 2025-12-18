import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Component } from '@/app/lib/definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const components = await sql<Component[]>`
      SELECT id, component_name
      FROM users.components
      ORDER BY component_name ASC
    `;

    return Response.json(components);
  } catch (error) {
    console.error('Failed to fetch components:', error);
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

    const { component_name } = await req.json();

    if (!component_name || component_name.trim() === '') {
      return Response.json({ error: 'Component name is required' }, { status: 400 });
    }

    const newComponent = await sql<Component[]>`
      INSERT INTO users.components (component_name)
      VALUES (${component_name.trim()})
      RETURNING id, component_name
    `;

    return Response.json(newComponent[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create component:', error);
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

    const { id, component_name } = await req.json();

    if (!id || !component_name || component_name.trim() === '') {
      return Response.json({ error: 'Component ID and name are required' }, { status: 400 });
    }

    const updatedComponent = await sql<Component[]>`
      UPDATE users.components
      SET component_name = ${component_name.trim()}
      WHERE id = ${id}
      RETURNING id, component_name
    `;

    if (updatedComponent.length === 0) {
      return Response.json({ error: 'Component not found' }, { status: 404 });
    }

    return Response.json(updatedComponent[0]);
  } catch (error) {
    console.error('Failed to update component:', error);
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
      return Response.json({ error: 'Component ID is required' }, { status: 400 });
    }

    // Check if component has any permissions
    const permissions = await sql`
      SELECT COUNT(*) as count
      FROM users.role_permissions
      WHERE component_id = ${Number(id)}
    `;

    if (permissions[0].count > 0) {
      return Response.json({ 
        error: 'Cannot delete component that has permissions assigned' 
      }, { status: 400 });
    }

    const deletedComponent = await sql<Component[]>`
      DELETE FROM users.components
      WHERE id = ${Number(id)}
      RETURNING id, component_name
    `;

    if (deletedComponent.length === 0) {
      return Response.json({ error: 'Component not found' }, { status: 404 });
    }

    return Response.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error('Failed to delete component:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}