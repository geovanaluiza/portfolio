import { db } from "../lib/db.js";
import { send, readJson, clientIpHash } from "../lib/http.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = { name: 100, email: 200, subject: 200, message: 5000 };
const MAX_PER_WINDOW = 3; // messages per visitor
const WINDOW_MINUTES = 10;

export function validate(input) {
  const clean = {};
  for (const key of Object.keys(LIMITS)) {
    clean[key] = typeof input[key] === "string" ? input[key].trim() : "";
  }
  const errors = {};
  if (!clean.name) errors.name = "Please enter your name.";
  if (!EMAIL_RE.test(clean.email)) errors.email = "Please enter a valid email address.";
  if (clean.message.length < 5) errors.message = "Please write a message of at least 5 characters.";
  for (const [key, max] of Object.entries(LIMITS)) {
    if (clean[key].length > max) errors[key] = `Please keep this under ${max} characters.`;
  }
  return { clean, errors };
}

async function notifyByEmail({ name, email, subject, message }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!key || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Portfolio <onboarding@resend.dev>",
        to: [to],
        reply_to: email,
        subject: `New message from ${name}: ${subject || "(no subject)"}`,
        text: `${message}\n\n— ${name} <${email}>`,
      }),
    });
  } catch (err) {
    console.error("Email notification failed", err);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Use POST to send a message." });
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    return send(res, 400, { error: "The request body must be JSON." });
  }

  // Honeypot: real visitors never fill the hidden "website" field.
  if (body.website) return send(res, 201, { ok: true });

  const { clean, errors } = validate(body);
  if (Object.keys(errors).length) return send(res, 422, { error: "Please check the highlighted fields.", fields: errors });

  try {
    const pool = await db();
    const ipHash = clientIpHash(req);
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM messages WHERE ip_hash = $1 AND created_at > NOW() - make_interval(mins => $2)`,
      [ipHash, WINDOW_MINUTES]
    );
    if (rows[0].n >= MAX_PER_WINDOW) {
      return send(res, 429, { error: "You've sent a few messages already. Please try again in a few minutes." });
    }
    await pool.query(
      `INSERT INTO messages (name, email, subject, message, ip_hash) VALUES ($1, $2, $3, $4, $5)`,
      [clean.name, clean.email, clean.subject || null, clean.message, ipHash]
    );
    await notifyByEmail(clean);
    return send(res, 201, { ok: true });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "Your message couldn't be saved. Please email me directly instead." });
  }
}
