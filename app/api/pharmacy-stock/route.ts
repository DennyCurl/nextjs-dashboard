import { NextRequest } from 'next/server';
import postgres from 'postgres';
import { cookies } from 'next/headers';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export interface StockItem {
    id: number;
    drug_name: string;
    quantity: number;
    unit?: string;
    room_name?: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';

        const offset = (page - 1) * limit;

        // Отримуємо поточну локалізацію з cookies
        const cookieStore = await cookies();
        const currentLocalsId = cookieStore.get('current_locals_id')?.value;

        if (!currentLocalsId) {
            return Response.json({ error: 'No localization selected' }, { status: 400 });
        }

        // Отримуємо компоненти локалізації (organization, department, room)
        const localsInfo = await sql`
            SELECT organization_id, department_id, room_id
            FROM users.locals
            WHERE id = ${Number(currentLocalsId)}
        `;

        if (localsInfo.length === 0) {
            return Response.json({ error: 'Localization not found' }, { status: 404 });
        }

        const { organization_id, department_id, room_id } = localsInfo[0];

        let countResult;
        let dataResult;

        if (search) {
            // Search with hierarchical filter
            countResult = await sql`
                SELECT COUNT(*) 
                FROM pharmacy.stock s
                LEFT JOIN pharmacy.base b ON b.id = s.id
                LEFT JOIN users.locals l ON s.assignment_id = l.id
                WHERE 
                    b.full_drug_name ILIKE ${`%${search}%`}
                    AND s.quantity > 0
                    AND l.organization_id = ${organization_id}
                    AND (${department_id}::bigint IS NULL OR l.department_id = ${department_id})
                    AND (${room_id}::bigint IS NULL OR l.room_id = ${room_id})
            `;

            dataResult = await sql`
                SELECT 
                    s.id,
                    b.full_drug_name as drug_name,
                    s.quantity,
                    b.unit,
                    r.room_name
                FROM pharmacy.stock s
                LEFT JOIN pharmacy.base b ON b.id = s.id
                LEFT JOIN users.locals l ON s.assignment_id = l.id
                LEFT JOIN users.rooms r ON l.room_id = r.id
                WHERE 
                    b.full_drug_name ILIKE ${`%${search}%`}
                    AND s.quantity > 0
                    AND l.organization_id = ${organization_id}
                    AND (${department_id}::bigint IS NULL OR l.department_id = ${department_id})
                    AND (${room_id}::bigint IS NULL OR l.room_id = ${room_id})
                ORDER BY r.room_name ASC, b.full_drug_name ASC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else {
            // Without search, hierarchical filter
            countResult = await sql`
                SELECT COUNT(*) 
                FROM pharmacy.stock s
                LEFT JOIN users.locals l ON s.assignment_id = l.id
                WHERE s.quantity > 0
                    AND l.organization_id = ${organization_id}
                    AND (${department_id}::bigint IS NULL OR l.department_id = ${department_id})
                    AND (${room_id}::bigint IS NULL OR l.room_id = ${room_id})
            `;

            dataResult = await sql`
                SELECT 
                    s.id,
                    b.full_drug_name as drug_name,
                    s.quantity,
                    b.unit,
                    r.room_name
                FROM pharmacy.stock s
                LEFT JOIN pharmacy.base b ON b.id = s.id
                LEFT JOIN users.locals l ON s.assignment_id = l.id
                LEFT JOIN users.rooms r ON l.room_id = r.id
                WHERE s.quantity > 0
                    AND l.organization_id = ${organization_id}
                    AND (${department_id}::bigint IS NULL OR l.department_id = ${department_id})
                    AND (${room_id}::bigint IS NULL OR l.room_id = ${room_id})
                ORDER BY r.room_name ASC, b.full_drug_name ASC
                LIMIT ${limit} OFFSET ${offset}
            `;
        }

        const totalCount = countResult ? parseInt(countResult[0].count.toString()) : 0;

        // Transform data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stockItems = dataResult.map((row: Record<string, any>) => ({
            id: row.id,
            drug_name: row.drug_name,
            quantity: row.quantity,
            unit: row.unit
        }));

        return new Response(JSON.stringify({
            data: stockItems,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Database Error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to fetch stock data' }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}
