export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const pageSize = Math.min(parseInt(searchParams.get('pageSize')||'15',10), 50);
  const apiKey = process.env.FDC_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'Missing FDC_API_KEY' }), { status: 400 });
  const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
  url.searchParams.set('query', q);
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('api_key', apiKey);
  const r = await fetch(url.toString());
  const data = await r.json();
  const items = (data?.foods||[]).map(f => ({
    id: f.fdcId,
    name: f.description,
    brand: f.brandOwner || '',
    source: 'FDC',
    nutrients: {
      protein: nutrientVal(f, 1003),
      fat: nutrientVal(f, 1004),
      carbohydrates: nutrientVal(f, 1005),
      energy_kcal: nutrientVal(f, 1008),
    }
  }));
  return Response.json({ items });
  function nutrientVal(food, id) {
    const n = (food.foodNutrients || []).find(n => n.nutrientId === id || n.nutrient?.number == id || n.number == id);
    return n ? Number(n.value) : 0;
  }
}
