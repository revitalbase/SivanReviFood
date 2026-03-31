// Vercel Serverless Function — שולף thumbnail + טקסט מכל לינק
// עובד מצד שרת כדי לעקוף חסימת CORS

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'missing url' });

  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Twitterbot/1.0)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'he,en;q=0.9',
  };

  // Instagram oEmbed
  if (url.includes('instagram.com')) {
    try {
      const r = await fetch(
        `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}&maxwidth=640`,
        { headers: { ...headers, 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' } }
      );
      if (r.ok) {
        const d = await r.json();
        if (d.thumbnail_url) return res.json({ thumb: d.thumbnail_url, title: d.title||'', text:'' });
      }
    } catch (e) {}
  }

  // TikTok oEmbed
  if (url.includes('tiktok.com')) {
    try {
      const r = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      if (r.ok) {
        const d = await r.json();
        if (d.thumbnail_url) return res.json({ thumb: d.thumbnail_url, title: d.title||'', text:'' });
      }
    } catch (e) {}
  }

  // כל אתר — scrape HTML
  try {
    const r = await fetch(url, { headers });
    if (!r.ok) return res.json({ thumb:'', title:'', text:'' });
    const html = await r.text();

    const thumbMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const thumb = thumbMatch?.[1] || '';

    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = (titleMatch?.[1]||'').trim();

    const text = extractText(html);
    return res.json({ thumb, title, text });
  } catch (e) {
    return res.json({ thumb:'', title:'', text:'', error: e.message });
  }
}

function extractText(html) {
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '');

  // חפש אזור מתכון ספציפי
  const recipeMatch = clean.match(
    /<[^>]+(?:class|itemtype)[^>]*(?:recipe|ingredient|instruction|wprm|tasty|recipe-card)[^>]*>[\s\S]{100,8000}/i
  );
  if (recipeMatch) clean = recipeMatch[0];

  return clean
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#[0-9]+;/g, '').replace(/\s{3,}/g, '\n').trim()
    .substring(0, 4000);
}
