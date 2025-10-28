import postgres from 'postgres';
import type { NextRequest } from 'next/server';

type L5 = { id: number; code_atc_level_5: string; atc_level_5: string; id_atc_level_4: number };
type L4 = { id: number; code_atc_level_4: string; atc_level_4: string; id_atc_level_3: number; children?: L5[] };
type L3 = { id: number; code_atc_level_3: string; atc_level_3: string; id_atc_level_2: number; children?: L4[] };
type L2 = { id: number; code_atc_level_2: string; atc_level_2: string; id_atc_level_1: number; children?: L3[] };
type L1 = { id: number; code_atc_level_1: string; atc_level_1: string; children?: L2[] };

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET(req: NextRequest) {
  try {
    const level1 = (await sql`SELECT id, code_atc_level_1, atc_level_1 FROM atc_level_1 ORDER BY code_atc_level_1`) as L1[];
    const level2 = (await sql`SELECT id, code_atc_level_2, atc_level_2, id_atc_level_1 FROM atc_level_2 ORDER BY code_atc_level_2`) as L2[];
    const level3 = (await sql`SELECT id, code_atc_level_3, atc_level_3, id_atc_level_2 FROM atc_level_3 ORDER BY code_atc_level_3`) as L3[];
    const level4 = (await sql`SELECT id, code_atc_level_4, atc_level_4, id_atc_level_3 FROM atc_level_4 ORDER BY code_atc_level_4`) as L4[];
    const level5 = (await sql`SELECT id, code_atc_level_5, atc_level_5, id_atc_level_4 FROM atc_level_5 ORDER BY code_atc_level_5`) as L5[];

    const l2ByParent: Record<string, L2[]> = {};
    for (const l2 of level2) {
      const parent = String(l2.id_atc_level_1);
      l2ByParent[parent] = l2ByParent[parent] || [];
      l2ByParent[parent].push(l2);
    }

    const l3ByParent: Record<string, L3[]> = {};
    for (const l3 of level3) {
      const parent = String(l3.id_atc_level_2);
      l3ByParent[parent] = l3ByParent[parent] || [];
      l3ByParent[parent].push(l3);
    }

    const l4ByParent: Record<string, L4[]> = {};
    for (const l4 of level4) {
      const parent = String(l4.id_atc_level_3);
      l4ByParent[parent] = l4ByParent[parent] || [];
      l4ByParent[parent].push(l4);
    }

    const l5ByParent: Record<string, L5[]> = {};
    for (const l5 of level5) {
      const parent = String(l5.id_atc_level_4);
      l5ByParent[parent] = l5ByParent[parent] || [];
      l5ByParent[parent].push(l5);
    }

    const tree = level1.map((l1) => ({
      id: l1.id,
      code_atc_level_1: l1.code_atc_level_1,
      atc_level_1: l1.atc_level_1,
      children: (l2ByParent[String(l1.id)] || []).map((l2) => ({
        id: l2.id,
        code_atc_level_2: l2.code_atc_level_2,
        atc_level_2: l2.atc_level_2,
        children: (l3ByParent[String(l2.id)] || []).map((l3) => ({
          id: l3.id,
          code_atc_level_3: l3.code_atc_level_3,
          atc_level_3: l3.atc_level_3,
          children: (l4ByParent[String(l3.id)] || []).map((l4) => ({
            id: l4.id,
            code_atc_level_4: l4.code_atc_level_4,
            atc_level_4: l4.atc_level_4,
            children: (l5ByParent[String(l4.id)] || []).map((l5) => ({
              id: l5.id,
              code_atc_level_5: l5.code_atc_level_5,
              atc_level_5: l5.atc_level_5,
            })),
          })),
        })),
      })),
    }));

    // Server-side filtering by q (search across codes and labels)
    const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase();
    if (!q) return new Response(JSON.stringify(tree), { status: 200 });

    const matchesQ = (text?: string) => !!text && text.toLowerCase().includes(q);

    const filteredTree = tree
      .map((l1) => {
        const children2 = ((l1.children || [])
          .map((l2) => {
            const children3 = ((l2.children || [])
              .map((l3) => {
                const children4 = ((l3.children || [])
                  .map((l4) => {
                    const children5 = (l4.children || []).filter(
                      (l5) => matchesQ(l5.code_atc_level_5) || matchesQ(l5.atc_level_5),
                    );
                    const l4Matches = matchesQ(l4.code_atc_level_4) || matchesQ(l4.atc_level_4);
                    if (children5.length || l4Matches) return { ...l4, children: children5 };
                    return null;
                  })
                  .filter(Boolean) as unknown) as L4[];

                const l3Matches = matchesQ(l3.code_atc_level_3) || matchesQ(l3.atc_level_3);
                if (children4.length || l3Matches) return { ...l3, children: children4 };
                return null;
              })
              .filter(Boolean) as unknown) as L3[];

            const l2Matches = matchesQ(l2.code_atc_level_2) || matchesQ(l2.atc_level_2);
            if (children3.length || l2Matches) return { ...l2, children: children3 };
            return null;
          })
          .filter(Boolean) as unknown) as L2[];

        const l1Matches = matchesQ(l1.code_atc_level_1) || matchesQ(l1.atc_level_1);
        if (children2.length || l1Matches) return { ...l1, children: children2 } as L1;
        return null;
      })
      .filter(Boolean);

    return new Response(JSON.stringify(filteredTree), { status: 200 });
  } catch (err) {
    console.error('Failed to fetch ATC tree:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
