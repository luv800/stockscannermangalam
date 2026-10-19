export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB;
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (request.method === "GET") {
      const { results } = await db.prepare("SELECT * FROM stock_items ORDER BY id DESC").all();
      return Response.json(results, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const { part, desc, hsn, qty, rate, per, rack } = body;

      if (!part) {
        return Response.json({ error: "Part number is required" }, { status: 400, headers: corsHeaders });
      }

      const existing = await db.prepare("SELECT * FROM stock_items WHERE LOWER(part) = LOWER(?)").bind(part).first();

      if (existing) {
        await db.prepare(`
          UPDATE stock_items 
          SET desc = COALESCE(?, desc), 
              hsn = COALESCE(?, hsn), 
              qty = ?, 
              rate = COALESCE(?, rate), 
              per = COALESCE(?, per), 
              rack = COALESCE(?, rack),
              updated_at = CURRENT_TIMESTAMP
          WHERE LOWER(part) = LOWER(?)
        `).bind(desc || null, hsn || null, qty, rate || 0, per || 'Nos', rack || null, part).run();
      } else {
        await db.prepare(`
          INSERT INTO stock_items (part, desc, hsn, qty, rate, per, rack) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(part, desc || '', hsn || '', qty || 1, rate || 0, per || 'Nos', rack || '').run();
      }

      return Response.json({ success: true }, { headers: corsHeaders });
    }

    if (request.method === "DELETE") {
      const part = url.searchParams.get("part");
      if (!part) {
        return Response.json({ error: "Part parameter required" }, { status: 400, headers: corsHeaders });
      }
      await db.prepare("DELETE FROM stock_items WHERE LOWER(part) = LOWER(?)").bind(part).run();
      return Response.json({ success: true }, { headers: corsHeaders });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (err) {
    // This will return the exact database/syntax error to your frontend alert!
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
