import { db } from "../lib/db.js";
import { send, readJson, isAdmin } from "../lib/http.js";

// Admin-only: list, mark as read, and delete contact messages.
export default async function handler(req, res) {
  if (!isAdmin(req)) return send(res, 401, { error: "Wrong password." });

  try {
    const pool = await db();

    if (req.method === "GET") {
      const { rows } = await pool.query(
        `SELECT id, name, email, subject, message, is_read, created_at FROM messages ORDER BY created_at DESC LIMIT 200`
      );
      const views = await pool.query(`SELECT count FROM page_views WHERE id = 1`);
      return send(res, 200, { messages: rows, views: Number(views.rows[0]?.count || 0) });
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      const body = await readJson(req);
      const id = Number(body.id);
      if (!Number.isInteger(id)) return send(res, 400, { error: "A message id is required." });
      if (req.method === "PATCH") {
        await pool.query(`UPDATE messages SET is_read = $2 WHERE id = $1`, [id, body.is_read !== false]);
      } else {
        await pool.query(`DELETE FROM messages WHERE id = $1`, [id]);
      }
      return send(res, 200, { ok: true });
    }

    res.setHeader("Allow", "GET, PATCH, DELETE");
    return send(res, 405, { error: "Method not allowed." });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "The database couldn't be reached." });
  }
}
