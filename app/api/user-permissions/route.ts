import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserPermissions } from '@/app/lib/rbac';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await getUserPermissions(user.id);
    return Response.json(permissions);
  } catch (error) {
    console.error('Failed to fetch user permissions:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}