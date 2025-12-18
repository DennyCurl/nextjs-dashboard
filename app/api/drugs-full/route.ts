import postgres from 'postgres';
import type { NextRequest } from 'next/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

type NodeRow = { id: number; code: string | null; name: string; level: number | null; parent_id: number | null; classification: string };
type DrugRow = { id: number; full_drug_name: string; id_drugclassification: number | null; unit?: string | null; available_quantity?: number | null };
type Node = NodeRow & { children: Node[]; drugs: DrugRow[] };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const isTopRequest = searchParams.get('top') === 'true';

    // If requesting top medications, return them directly
    if (isTopRequest) {
      const topMeds = (await sql`
        SELECT 
          t.id_drug,
          b.full_drug_name,
          t.usage_count
        FROM pharmacy.top t
        LEFT JOIN pharmacy.base b ON b.id = t.id_drug
        ORDER BY t.usage_count DESC
        LIMIT 5
      `) as Array<{ id_drug: number; full_drug_name: string; usage_count: number }>;

      return new Response(JSON.stringify(topMeds), { status: 200 });
    }

    // load classification nodes for ATC and VMP (medical devices)
    const nodes = (await sql`
      SELECT id, code, name, level, parent_id, classification
      FROM pharmacy.classification
      WHERE classification IN ('atc','vmp')
      ORDER BY classification, level NULLS FIRST, code NULLS FIRST, name
    `) as NodeRow[];

    // only include drugs that are available (quantity > 0) in pharmacy.stock
    const drugs = (await sql`
      SELECT db.id, db.full_drug_name, db."id_drugClassification" AS id_drugclassification, db.unit, am.quantity AS available_quantity
      FROM pharmacy.base db
      JOIN pharmacy.stock am ON am.id = db.id AND am.quantity > 0
      ORDER BY db.full_drug_name
    `) as DrugRow[];

    const nodesById: Record<number, Node> = {};
    for (const n of nodes) nodesById[n.id] = { ...n, children: [], drugs: [] } as Node;

    // attach child nodes
    for (const id in nodesById) {
      const n = nodesById[id];
      if (n.parent_id != null && nodesById[n.parent_id]) {
        nodesById[n.parent_id].children!.push(n);
      }
    }

    // attach drugs to their classification node
    const drugsByNode: Record<string, DrugRow[]> = {};
    for (const d of drugs) {
      const key = String(d.id_drugclassification ?? '');
      if (!drugsByNode[key]) drugsByNode[key] = [];
      drugsByNode[key].push(d);
    }
    for (const [nid, node] of Object.entries(nodesById)) {
      node.drugs = drugsByNode[nid] || [];
    }

    // find roots (those without parent or parent missing)
    const roots = Object.values(nodesById).filter((n) => !n.parent_id || !nodesById[n.parent_id]);

    // server-side filtering by q (search across codes/names and drug names)
    const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase();
    if (!q) {
      // return full tree (do not prune branches without drugs) so client can render empty branches
      return new Response(JSON.stringify(roots), { status: 200 });
    }

    const matchesQ = (text?: string) => !!text && text.toLowerCase().includes(q);

    function filterNode(node: Node): boolean {
      // check drugs
      const matchedDrugs = (node.drugs || []).filter((d: DrugRow) => matchesQ(d.full_drug_name));
      // filter children recursively
      const childMatches: Node[] = [];
      for (const c of node.children || []) {
        const res = filterNode(c);
        if (res) childMatches.push(c);
      }
      const nodeMatches = matchesQ(node.code ?? '') || matchesQ(node.name);
      node.children = childMatches;
      node.drugs = matchedDrugs;
      return nodeMatches || matchedDrugs.length > 0 || childMatches.length > 0;
    }

    const filteredTree: Node[] = [];
    for (const r of roots) {
      if (filterNode(r)) filteredTree.push(r);
    }

    return new Response(JSON.stringify(filteredTree), { status: 200 });
  } catch (err) {
    console.error('Failed to fetch drugs tree:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
