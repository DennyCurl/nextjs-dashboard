import { NextResponse } from 'next/server';

// Тимчасовий endpoint призначення ролі адміністратора видалено.
export async function GET() {
  return NextResponse.json({ error: 'Endpoint deprecated' }, { status: 404 });
}