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

    const organizations = await sql`
      SELECT id, organization_name, created_at
      FROM users.organizations
      ORDER BY organization_name
    `;

    return Response.json(organizations);
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
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

    const { organization_name } = await req.json();

    if (!organization_name) {
      return Response.json({ 
        error: 'Organization name is required' 
      }, { status: 400 });
    }

    const newOrganization = await sql`
      INSERT INTO users.organizations (organization_name)
      VALUES (${organization_name})
      RETURNING id, organization_name, created_at
    `;

    return Response.json(newOrganization[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create organization:', error);
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
      return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const deletedOrganization = await sql`
      DELETE FROM users.organizations
      WHERE id = ${Number(id)}
      RETURNING id, organization_name
    `;

    if (deletedOrganization.length === 0) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    return Response.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Failed to delete organization:', error);
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

    const { id, organization_name } = await req.json();

    if (!id || !organization_name) {
      return Response.json({ 
        error: 'Organization ID and name are required' 
      }, { status: 400 });
    }

    const updatedOrganization = await sql`
      UPDATE users.organizations
      SET organization_name = ${organization_name}
      WHERE id = ${Number(id)}
      RETURNING id, organization_name, created_at
    `;

    if (updatedOrganization.length === 0) {
      return Response.json({ error: 'Organization not found' }, { status: 404 });
    }

    return Response.json(updatedOrganization[0]);
  } catch (error) {
    console.error('Failed to update organization:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
