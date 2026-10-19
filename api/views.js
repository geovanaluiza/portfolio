import { db } from "../lib/db.js";
import { send } from "../lib/http.js";

// POST counts a visit and returns the total; GET only reads it.
export default async function handler(req, res) {
  try {
    const pool = await db();
    if (req.method === "POST") {
      const { rows } = await pool.query(`UPDATE page_views SET count = count + 1 WHERE id = 1 RETURNING count`);
      return send(res, 200, { views: Number(rows[0].count) });
    }
    if (req.method === "GET") {
      const { rows } = await pool.query(`SELECT count FROM page_views WHERE id = 1`);
      return send(res, 200, { views: Number(rows[0]?.count || 0) });
    }
    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed." });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "The database couldn't be reached." });
  }
}
