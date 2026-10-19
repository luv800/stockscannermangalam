export async function onRequest(context) {
  const db = context.env.DB;
  const method = context.request.method;

  if (method === 'GET') {
    try {
      const { results } = await db.prepare("SELECT * FROM inventory ORDER BY id ASC").all();
      return Response.json(results);
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  if (method === 'POST') {
    try {
      const body = await context.request.json();
      if (body.action === 'insert') {
        await db.prepare("INSERT INTO inventory (part, desc, hsn, qty, rate, per, rack) VALUES (?, ?, ?, ?, ?, ?, ?)")
          .bind(body.part, body.desc, body.hsn, body.qty, body.rate, body.per, body.rack)
          .run();
      } else if (body.action === 'update') {
        await db.prepare("UPDATE inventory SET part=?, desc=?, hsn=?, qty=?, rate=?, per=?, rack=? WHERE id=?")
          .bind(body.part, body.desc, body.hsn, body.qty, body.rate, body.per, body.rack, body.id)
          .run();
      } else if (body.action === 'delete') {
        await db.prepare("DELETE FROM inventory WHERE id=?").bind(body.id).run();
      }
      return Response.json({ success: true });
    } catch (err) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}