// Serves _site/ under /placeholderkit/, like GitHub Pages does, to check the production build locally.
// Usage: npm run site && npm run site:preview   →  http://localhost:4174/placeholderkit/
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const BASE = "/placeholderkit/";
const PORT = Number(process.env.PORT || 4174);
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8" };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/" || path === BASE.slice(0, -1)) return res.writeHead(301, { Location: BASE }).end();
  if (!path.startsWith(BASE)) return res.writeHead(404).end("Not found (the site lives under /placeholderkit/)");
  let file = join("_site", normalize(path.slice(BASE.length)).replace(/^(\.\.[/\\])+/, ""));
  try {
    if ((await stat(file)).isDirectory()) {
      if (!path.endsWith("/")) return res.writeHead(301, { Location: path + "/" }).end();
      file = join(file, "index.html");
    }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});

// If the port is taken (say, by an earlier preview), try the next few instead of crashing.
let port = PORT;
server.on("error", (err) => {
  if (err.code !== "EADDRINUSE" || port >= PORT + 10) throw err;
  console.log(`Port ${port} is in use, trying ${port + 1}`);
  server.listen(++port, "127.0.0.1");
});
server.on("listening", () => console.log(`Serving _site at http://localhost:${port}${BASE}`));
server.listen(port, "127.0.0.1");
