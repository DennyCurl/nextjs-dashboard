import postgres from 'postgres';
import { NextResponse } from 'next/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function POST() {
    try {
        // Get the maximum id from visits table
        const maxIdResult = await sql`
      SELECT COALESCE(MAX(id), 0) as max_id FROM visits
    `;
        const maxId = maxIdResult[0]?.max_id || 0;

        // Reset the sequence to start from max_id + 1
        await sql`
      SELECT setval(pg_get_serial_sequence('visits', 'id'), ${maxId + 1}, false)
    `;

        return NextResponse.json({
            success: true,
            message: `Visits sequence reset successfully. Next ID will be ${maxId + 1}`,
            maxId: maxId
        });

    } catch (error) {
        console.error('Error fixing visits sequence:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fix visits sequence',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}