export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const pageSize = Math.min(parseInt(searchParams.get('pageSize')||'15',10), 50);
  const url = new URL('https://world.openfoodfacts.org/api/v2/search');
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('fields', 'code,product_name,brands,nutriments,nutriscore_grade,countries_tags');
  url.searchParams.set('sort_by', 'popularity_key');
  url.searchParams.set('search_terms', q);
  const r = await fetch(url.toString(), { headers: { 'User-Agent': 'nutrition-coach-mvp/0.2 (+github)' } });
  const data = await r.json();
  const items = (data?.products || []).map(p => ({
    id: p.code,
    name: p.product_name,
    brand: p.brands,
    source: 'OFF',
    nutriments: p.nutriments || {},
    nutriscore: p.nutriscore_grade || null,
    countries: p.countries_tags || [],
  }));
  return Response.json({ items });
}
