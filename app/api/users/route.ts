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

    const users = await sql`
      SELECT 
        user_id,
        user_name,
        created_at
      FROM users.users
      ORDER BY user_name ASC NULLS LAST, created_at DESC
    `;

    return Response.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
