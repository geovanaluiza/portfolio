// Local development server: serves /public and routes /api/* to the same handlers Vercel runs.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".pdf": "application/pdf", ".svg": "image/svg+xml" };
const port = Number(process.env.PORT || 3000);

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/api/")) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, "");
    try {
      const mod = await import(pathToFileURL(path.join(root, "api", `${name}.js`)).href);
      return mod.default(req, res);
    } catch {
      res.statusCode = 404;
      return res.end("Not found");
    }
  }
  let file = path.join(root, "public", path.normalize(url.pathname).replace(/^(\.\.[/\\])+/, ""));
  if (url.pathname.endsWith("/")) file = path.join(file, "index.html");
  try {
    let data;
    try { data = await fs.readFile(file); }
    catch { file += ".html"; data = await fs.readFile(file); }
    res.setHeader("Content-Type", types[path.extname(file)] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(port, () => console.log(`Portfolio running at http://localhost:${port}`));
