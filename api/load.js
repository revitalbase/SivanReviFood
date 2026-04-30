// /api/load.js — loads data from Supabase server-side (no CORS issues)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Not configured' });

  const id = req.query.id || 'page_content';
  try {
    const r = await fetch(
      `${supabaseUrl}/rest/v1/recipes?id=eq.${id}&select=data`,
      { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
    );
    const d = await r.json();
    if (d && d[0] && d[0].data) return res.status(200).json({ data: d[0].data });
    return res.status(200).json({ data: null });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
