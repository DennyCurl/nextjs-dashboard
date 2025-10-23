import postgres from 'postgres';
import type { NextRequest } from 'next/server';

type L1 = { id: number; level_1: string; code_level_1: string };
type L2 = { id: number; level_2: string; code_level_2: string; id_level_1: number };
type L3 = { id: number; level_3: string; code_level_3: string; id_level_2: number };

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET(req: NextRequest) {
  try {
    // Fetch all levels and construct nested structure in JS
    const level1 = (await sql`SELECT id, level_1, code_level_1 FROM icd_level_1 ORDER BY code_level_1`) as L1[];
    const level2 = (await sql`SELECT id, level_2, code_level_2, id_level_1 FROM icd_level_2 ORDER BY code_level_2`) as L2[];
    const level3 = (await sql`SELECT id, level_3, code_level_3, id_level_2 FROM icd_level_3 ORDER BY code_level_3`) as L3[];

    const l2ByParent: Record<string, L2[]> = {};
    for (const l2 of level2) {
      const parent = String(l2.id_level_1);
      l2ByParent[parent] = l2ByParent[parent] || [];
      l2ByParent[parent].push(l2);
    }

    const l3ByParent: Record<string, L3[]> = {};
    for (const l3 of level3) {
      const parent = String(l3.id_level_2);
      l3ByParent[parent] = l3ByParent[parent] || [];
      l3ByParent[parent].push(l3);
    }

    const tree = level1.map((l1) => ({
      id: l1.id,
      code_level_1: l1.code_level_1,
      level_1: l1.level_1,
      children: (l2ByParent[String(l1.id)] || []).map((l2) => ({
        id: l2.id,
        code_level_2: l2.code_level_2,
        level_2: l2.level_2,
        children: (l3ByParent[String(l2.id)] || []).map((l3) => ({
          id: l3.id,
          code_level_3: l3.code_level_3,
          level_3: l3.level_3,
        })),
      })),
    }));

    // Server-side filtering: if `q` is provided, include only branches matching q
    const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase();
    if (!q) {
      return new Response(JSON.stringify(tree), { status: 200 });
    }

    const matchesQ = (text?: string) => !!text && text.toLowerCase().includes(q);

    const filteredTree = tree
      .map((l1) => {
        const children2 = ((l1.children || [])
          .map((l2) => {
            const children3 = (l2.children || []).filter(
              (l3) => matchesQ(l3.code_level_3) || matchesQ(l3.level_3),
            );
            const l2Matches = matchesQ(l2.code_level_2) || matchesQ(l2.level_2);
            if (children3.length || l2Matches) {
              return { ...l2, children: children3 };
            }
            return null;
          })
          .filter(Boolean) as unknown) as L2[];

        const l1Matches = matchesQ(l1.code_level_1) || matchesQ(l1.level_1);
        if (children2.length || l1Matches) {
          return {
            id: l1.id,
            code_level_1: l1.code_level_1,
            level_1: l1.level_1,
            children: children2,
          } as L1;
        }
        return null;
      })
      .filter(Boolean);

    return new Response(JSON.stringify(filteredTree), { status: 200 });
  } catch (err) {
    console.error('Failed to fetch ICD tree:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
