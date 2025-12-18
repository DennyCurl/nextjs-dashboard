import { NextRequest } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export interface WriteOff {
    id: number;
    created_at: string;
    quantity: number;
    assignment_id: number;
    user_id: string;
    drug_id: number;
    drug_name?: string;
    unit?: string;
    user_name?: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('assignment_id');

        let result;
        if (assignmentId) {
            result = await sql`
                SELECT 
                    w.id,
                    w.created_at,
                    w.quantity,
                    w.assignment_id,
                    w.user_id,
                    w.drug_id,
                    b.full_drug_name as drug_name,
                    b.unit,
                    u.user_name
                FROM pharmacy."write-off" w
                LEFT JOIN pharmacy.base b ON b.id = w.drug_id
                LEFT JOIN users.users u ON u.user_id = w.user_id
                WHERE w.assignment_id = ${Number(assignmentId)}
                ORDER BY w.created_at DESC
            `;
        } else {
            result = await sql`
                SELECT 
                    w.id,
                    w.created_at,
                    w.quantity,
                    w.assignment_id,
                    w.user_id,
                    w.drug_id,
                    b.full_drug_name as drug_name,
                    b.unit,
                    u.user_name
                FROM pharmacy."write-off" w
                LEFT JOIN pharmacy.base b ON b.id = w.drug_id
                LEFT JOIN users.users u ON u.user_id = w.user_id
                ORDER BY w.created_at DESC
                LIMIT 100
            `;
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch write-offs',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { drug_id, quantity, assignment_id, user_id } = body;

        // Validate required fields
        if (!drug_id || !quantity || !assignment_id || !user_id) {
            return new Response(JSON.stringify({
                error: 'drug_id, quantity, assignment_id, and user_id are required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check available stock before write-off
        const stock = await sql`
            SELECT quantity
            FROM pharmacy.stock
            WHERE id = ${drug_id} AND assignment_id = ${assignment_id}
        `;

        const availableQuantity = stock && stock.length > 0 ? Number(stock[0].quantity) : 0;

        if (availableQuantity < quantity) {
            return new Response(JSON.stringify({
                error: 'Insufficient stock',
                details: `Available: ${availableQuantity}, requested: ${quantity}`,
                available: availableQuantity
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Insert write-off
        const result = await sql`
            INSERT INTO pharmacy."write-off" (drug_id, quantity, assignment_id, user_id)
            VALUES (${drug_id}, ${quantity}, ${assignment_id}, ${user_id})
            RETURNING id
        `;

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
            error: 'Failed to create write-off',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({
                error: 'Write-off ID is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await sql`
            DELETE FROM pharmacy."write-off"
            WHERE id = ${Number(id)}
        `;

        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to delete write-off',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
