import { NextRequest } from 'next/server';
import { fetchInvoiceTransfers } from '@/app/lib/data';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get('invoiceId');

        if (!invoiceId) {
            return new Response(JSON.stringify({
                error: 'Invoice ID is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const transfers = await fetchInvoiceTransfers(parseInt(invoiceId));

        return new Response(JSON.stringify(transfers), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch invoice transfers',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
        const body = await request.json();
        const { invoice_id, drug_id, quantity } = body;

        // Validate required fields
        if (!invoice_id || !drug_id || !quantity) {
            await sql.end();
            return new Response(JSON.stringify({
                error: 'invoice_id, drug_id, and quantity are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get invoice details to determine assignment_id for stock check
        const invoice = await sql`
            SELECT from_local_assignment_id
            FROM pharmacy.invoices
            WHERE id = ${invoice_id}
        `;

        if (!invoice || invoice.length === 0) {
            await sql.end();
            return new Response(JSON.stringify({
                error: 'Invoice not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const assignment_id = invoice[0].from_local_assignment_id;

        // Check available stock for this drug and assignment
        if (assignment_id) {
            const stock = await sql`
                SELECT quantity
                FROM pharmacy.stock
                WHERE id = ${drug_id} AND assignment_id = ${assignment_id}
            `;

            const availableQuantity = stock && stock.length > 0 ? Number(stock[0].quantity) : 0;

            if (availableQuantity < quantity) {
                await sql.end();
                return new Response(JSON.stringify({
                    error: 'Insufficient stock',
                    details: `Available: ${availableQuantity}, requested: ${quantity}`,
                    available: availableQuantity
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Insert new transfer
        const result = await sql`
            INSERT INTO pharmacy.transfer (invoice_id, drug_id, quantity)
            VALUES (${invoice_id}, ${drug_id}, ${quantity})
            RETURNING id
        `;

        await sql.end();

        return new Response(JSON.stringify({
            success: true,
            id: result[0].id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to create invoice transfer',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}