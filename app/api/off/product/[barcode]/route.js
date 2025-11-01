export async function GET(_req, { params }) {
  const { barcode } = params;
  const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
  const r = await fetch(url, { headers: { 'User-Agent': 'nutrition-coach-mvp/0.2 (+github)' } });
  const data = await r.json();
  return Response.json(data);
}
