import postgres from 'postgres';
import { NextRequest } from 'next/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = req.nextUrl;
        const query = searchParams.get('q') || '';
        const classificationType = searchParams.get('type') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Build WHERE conditions
        const conditions = [];
        const searchPattern = query ? `%${query}%` : null;

        if (searchPattern) {
            conditions.push(`b.full_drug_name ILIKE '${searchPattern.replace("'", "''")}'`);
        }

        if (classificationType) {
            conditions.push(`c.classification = '${classificationType.replace("'", "''")}'`);
        }

        // Get total count and paginated data
        let countResult, dataResult;

        if (conditions.length > 0) {
            // With filters
            if (searchPattern && classificationType) {
                countResult = await sql`
          SELECT COUNT(*) 
          FROM pharmacy.base b 
          LEFT JOIN pharmacy.classification c ON c.id = b."id_drugClassification"
          WHERE b.full_drug_name ILIKE ${searchPattern} AND c.classification = ${classificationType}
        `;

                dataResult = await sql`
          SELECT 
            b.id,
            b.created_at,
            b.full_drug_name,
            b."id_drugClassification",
            b.unit,
            b.number,
            c.code as classification_code,
            c.name as classification_name,
            c.level as classification_level,
            c.classification as classification_type
          FROM pharmacy.base b
          LEFT JOIN pharmacy.classification c ON c.id = b."id_drugClassification"
          WHERE b.full_drug_name ILIKE ${searchPattern} AND c.classification = ${classificationType}
          ORDER BY b.full_drug_name ASC
          LIMIT ${limit} OFFSET ${offset}
        `;
            } else if (searchPattern) {
                countResult = await sql`
          SELECT COUNT(*) 
          FROM pharmacy.base b 
          WHERE b.full_drug_name ILIKE ${searchPattern}
        `;

                dataResult = await sql`
          SELECT 
            b.id,
            b.created_at,
            b.full_drug_name,
            b."id_drugClassification",
            b.unit,
            b.number,
            c.code as classification_code,
            c.name as classification_name,
            c.level as classification_level,
            c.classification as classification_type
          FROM pharmacy.base b
          LEFT JOIN pharmacy.classification c ON c.id = b."id_drugClassification"
          WHERE b.full_drug_name ILIKE ${searchPattern}
          ORDER BY b.full_drug_name ASC
          LIMIT ${limit} OFFSET ${offset}
        `;
            } else if (classificationType) {
                countResult = await sql`
          SELECT COUNT(*) 
          FROM pharmacy.base b 
          LEFT JOIN pharmacy.classification c ON c.id = b."id_drugClassification"
          WHERE c.classification = ${classificationType}
        `;

                dataResult = await sql`
          SELECT 
            b.id,
            b.created_at,
            b.full_drug_name,
            b."id_drugClassification",
            b.unit,
            b.number,
            c.code as classification_code,
            c.name as classification_name,
            c.level as classification_level,
            c.classification as classification_type
          FROM pharmacy.base b
          LEFT JOIN pharmacy.classification c ON c.id = b."id_drugClassification"
          WHERE c.classification = ${classificationType}
          ORDER BY b.full_drug_name ASC
          LIMIT ${limit} OFFSET ${offset}
        `;
            }
        } else {
            // Without filters
            countResult = await sql`
        SELECT COUNT(*) 
        FROM pharmacy.base b
      `;

            dataResult = await sql`
        SELECT 
          b.id,
          b.created_at,
          b.full_drug_name,
          b."id_drugClassification",
          b.unit,
          b.number,
          c.code as classification_code,
          c.name as classification_name,
          c.level as classification_level,
          c.classification as classification_type
        FROM pharmacy.base b
        LEFT JOIN pharmacy.classification c ON c.id = b."id_drugClassification"
        ORDER BY b.full_drug_name ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
        }

        const totalCount = countResult ? parseInt(countResult[0].count.toString()) : 0;

        return new Response(JSON.stringify({
            data: dataResult,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Database error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch pharmacy base data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}