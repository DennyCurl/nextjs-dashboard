import { NextRequest } from 'next/server';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export interface Invoice {
    id: number;
    created_at: string;
    date: string | null;
    name: string | null;
    from_id: string | null;  // Now UUID from auth.users
    to_id: string | null;    // Now UUID from auth.users
    notes: string | null;
    from_user_name?: string | null;
    from_user_email?: string | null;
    to_user_name?: string | null;
    to_user_email?: string | null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';

        const offset = (page - 1) * limit;

        let countResult;
        let dataResult;

        if (search) {
            // Search with user joins
            countResult = await sql`
                SELECT COUNT(*) 
                FROM pharmacy.invoices i
                LEFT JOIN users.users u_from ON u_from.user_id = i.from_user_id
                LEFT JOIN users.users u_to ON u_to.user_id = i.to_user_id
                LEFT JOIN users.locals l_from ON l_from.id = i.from_local_assignment_id
                LEFT JOIN users.locals l_to ON l_to.id = i.to_local_assignment_id
                LEFT JOIN users.organizations o_from ON o_from.id = l_from.organization_id
                LEFT JOIN users.organizations o_to ON o_to.id = l_to.organization_id
                WHERE 
                    i.name ILIKE ${`%${search}%`} OR
                    i.notes ILIKE ${`%${search}%`} OR
                    u_from.user_name ILIKE ${`%${search}%`} OR
                    u_to.user_name ILIKE ${`%${search}%`} OR
                    o_from.organization_name ILIKE ${`%${search}%`} OR
                    o_to.organization_name ILIKE ${`%${search}%`}
            `;

            dataResult = await sql`
                SELECT 
                    i.id,
                    i.created_at,
                    i.date,
                    i.name,
                    i.from_user_id,
                    i.to_user_id,
                    i.from_local_assignment_id,
                    i.to_local_assignment_id,
                    i.notes,
                    u_from.user_name as from_user_name,
                    o_from.organization_name as from_organization,
                    u_to.user_name as to_user_name,
                    o_to.organization_name as to_organization
                FROM pharmacy.invoices i
                LEFT JOIN users.users u_from ON u_from.user_id = i.from_user_id
                LEFT JOIN users.users u_to ON u_to.user_id = i.to_user_id
                LEFT JOIN users.locals l_from ON l_from.id = i.from_local_assignment_id
                LEFT JOIN users.locals l_to ON l_to.id = i.to_local_assignment_id
                LEFT JOIN users.locals l_to ON l_to.id = i.to_local_assignment_id
                LEFT JOIN users.organizations o_from ON o_from.id = l_from.organization_id
                LEFT JOIN users.organizations o_to ON o_to.id = l_to.organization_id
                WHERE 
                    i.name ILIKE ${`%${search}%`} OR
                    i.notes ILIKE ${`%${search}%`} OR
                    u_from.user_name ILIKE ${`%${search}%`} OR
                    u_to.user_name ILIKE ${`%${search}%`} OR
                    o_from.organization_name ILIKE ${`%${search}%`} OR
                    o_to.organization_name ILIKE ${`%${search}%`}
                ORDER BY i.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        } else {
            // Without search
            countResult = await sql`
                SELECT COUNT(*) 
                FROM pharmacy.invoices
            `;

            dataResult = await sql`
                SELECT 
                    i.id,
                    i.created_at,
                    i.date,
                    i.name,
                    i.from_user_id,
                    i.to_user_id,
                    i.from_local_assignment_id,
                    i.to_local_assignment_id,
                    i.notes,
                    u_from.user_name as from_user_name,
                    o_from.organization_name as from_organization,
                    u_to.user_name as to_user_name,
                    o_to.organization_name as to_organization
                FROM pharmacy.invoices i
                LEFT JOIN users.users u_from ON u_from.user_id = i.from_user_id
                LEFT JOIN users.users u_to ON u_to.user_id = i.to_user_id
                LEFT JOIN users.locals l_from ON l_from.id = i.from_local_assignment_id
                LEFT JOIN users.locals l_to ON l_to.id = i.to_local_assignment_id
                LEFT JOIN users.organizations o_from ON o_from.id = l_from.organization_id
                LEFT JOIN users.organizations o_to ON o_to.id = l_to.organization_id
                ORDER BY i.created_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
        }

        const totalCount = countResult ? parseInt(countResult[0].count.toString()) : 0;

        // Transform data to include user fields directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoices = dataResult.map((row: Record<string, any>) => ({
            id: row.id,
            created_at: row.created_at,
            date: row.date,
            name: row.name,
            from_user_id: row.from_user_id,
            to_user_id: row.to_user_id,
            from_local_assignment_id: row.from_local_assignment_id,
            to_local_assignment_id: row.to_local_assignment_id,
            notes: row.notes,
            from_user_name: row.from_user_name,
            from_organization: row.from_organization,
            to_user_name: row.to_user_name,
            to_organization: row.to_organization
        }));

        return new Response(JSON.stringify({
            data: invoices,
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
        console.error('API error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch invoices',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, date, from_id, to_id, notes } = body;

        const result = await sql`
            INSERT INTO pharmacy.invoices (name, date, from_id, to_id, notes)
            VALUES (${name}, ${date}, ${from_id}, ${to_id}, ${notes})
            RETURNING *
        `;

        return new Response(JSON.stringify({
            success: true,
            data: result[0]
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to create invoice',
            details: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}