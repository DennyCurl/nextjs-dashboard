import { NextRequest, NextResponse } from 'next/server';
import { fetchLatestAnamnesiVitae } from '@/app/lib/data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
  }

  try {
    const data = await fetchLatestAnamnesiVitae(patientId);
    return NextResponse.json(data || {});
  } catch (error) {
    console.error('Error fetching anamnesi vitae:', error);
    return NextResponse.json({ error: 'Failed to fetch anamnesi vitae' }, { status: 500 });
  }
}
