import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const transferId = parseInt(id);
        const { drug_id, quantity } = await request.json();

        await sql`
            UPDATE pharmacy.transfer 
            SET drug_id = ${drug_id}, quantity = ${quantity}
            WHERE id = ${transferId}
        `;

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to update transfer',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const transferId = parseInt(id);

        await sql`DELETE FROM pharmacy.transfer WHERE id = ${transferId}`;

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete transfer',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}