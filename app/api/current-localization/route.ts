import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL || '');

// GET: Отримати поточну локалізацію користувача
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Перевіряємо cookie
    const cookieStore = await cookies();
    const currentLocalsId = cookieStore.get('current_locals_id')?.value;

    // Отримуємо всі локалізації користувача
    const assignments = await sql`
      SELECT 
        la.id,
        la.locals_id,
        la.user_id,
        l.organization_id,
        l.department_id,
        l.room_id,
        o.organization_name,
        d.department_name,
        r.room_name
      FROM users.local_assignments la
      LEFT JOIN users.locals l ON la.locals_id = l.id
      LEFT JOIN users.organizations o ON l.organization_id = o.id
      LEFT JOIN users.departments d ON l.department_id = d.id
      LEFT JOIN users.rooms r ON l.room_id = r.id
      WHERE la.user_id = ${user.id}
    `;

    if (assignments.length === 0) {
      return NextResponse.json({ 
        error: 'No localizations assigned',
        assignments: [],
        current: null
      }, { status: 404 });
    }

    // Якщо є збережена локалізація в cookie, перевіряємо чи вона валідна
    let currentAssignment = null;
    if (currentLocalsId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentAssignment = (assignments as any[]).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a.locals_id.toString() === currentLocalsId
      );
    }

    return NextResponse.json({
      assignments,
      current: currentAssignment || null,
      needsSelection: assignments.length > 1 && !currentAssignment
    });
  } catch (error) {
    console.error('Error fetching current localization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Встановити поточну локалізацію
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { locals_id } = await request.json();

    if (!locals_id) {
      return NextResponse.json({ error: 'locals_id is required' }, { status: 400 });
    }

    // Перевіряємо, чи має користувач доступ до цієї локалізації
    const result = await sql`
      SELECT la.id, la.locals_id
      FROM users.local_assignments la
      WHERE la.user_id = ${user.id}
        AND la.locals_id = ${Number(locals_id)}
    `;

    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'User does not have access to this localization' 
      }, { status: 403 });
    }

    // Зберігаємо в cookie (7 днів)
    const cookieStore = await cookies();
    cookieStore.set('current_locals_id', locals_id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return NextResponse.json({ 
      success: true,
      locals_id: Number(locals_id)
    });
  } catch (error) {
    console.error('Error setting current localization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
