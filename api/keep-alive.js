// Vercel Cron Job — פינג ל-Supabase כל 5 ימים כדי למנוע השהיה
// Supabase Free Tier משהה פרויקטים אחרי שבוע ללא פעילות

const SUPABASE_URL = process.env.SUPABASE_URL || "https://cuorvzkjckgxgxrxpfmg.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1b3J2emtqY2tneGd4cnhwZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDQ0ODMsImV4cCI6MjA5MDUyMDQ4M30.Y_qYHVYyP9hi9LBkUb__0qg_ylGe-a19OaDpE-3ibZA";

export default async function handler(req, res) {
  try {
    // SELECT פשוט מהטבלה — מספיק כדי לשמור את הפרויקט ער
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/recipes?select=id&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    const status = response.status;
    const body = await response.text();

    console.log(`🏓 Supabase keep-alive ping: ${status}`);

    return res.status(200).json({
      ok: true,
      supabase_status: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Keep-alive failed:', error.message);
    return res.status(500).json({
      ok: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
