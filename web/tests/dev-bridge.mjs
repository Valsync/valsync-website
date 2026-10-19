// Local browser QA only. No credentials or synthetic production data.
// Run Next on :3000, then this bridge on :8888 to exercise native functions.
import { createServer, request as proxyRequest } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { load } from "./register.mjs";
const functions = new Map(["riot-companion", "riot-auth-start", "riot-auth-callback", "riot-auth-refresh", "riot-auth-logout", "riot-stats"].map(name => [name, load(`../netlify/functions/${name}.ts`).default]));
createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:8888");
  if (url.pathname.startsWith("/.netlify/functions/")) {
    const fn = functions.get(url.pathname.split("/").pop());
    if (!fn) { res.writeHead(404); res.end(); return; }
    const incoming = new Request(url, { method: req.method, headers: Object.fromEntries(Object.entries(req.headers).filter(([, v]) => typeof v === "string")) });
    const response = await fn(incoming);
    res.writeHead(response.status, { ...Object.fromEntries(response.headers), ...(response.headers.getSetCookie().length ? { "set-cookie": response.headers.getSetCookie() } : {}) });
    res.end(await response.text()); return;
  }
  if (process.argv.includes("--static")) {
    const root = resolve("..");
    const path = url.pathname === "/" ? "index.html" : url.pathname === "/play" ? "play.html" : decodeURIComponent(url.pathname.slice(1));
    if (!(path.startsWith("_next/") || path.startsWith("img/") || /^[\w.-]+\.(html|png|svg|ico|webp)$/.test(path))) { res.writeHead(404); res.end(); return; }
    const file = resolve(root, path);
    if (!file.startsWith(root + "/") && !file.startsWith(root + "\\")) { res.writeHead(403); res.end(); return; }
    try {
      const content = await readFile(file);
      const types = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ttf": "font/ttf", ".webp": "image/webp" };
      res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" }); res.end(content);
    } catch { res.writeHead(404); res.end(); }
    return;
  }
  const upstream = proxyRequest({ host: "localhost", port: 3000, path: req.url, method: req.method, headers: { ...req.headers, host: "localhost:3000" } }, response => { res.writeHead(response.statusCode, response.headers); response.pipe(res); });
  upstream.on("error", () => { res.writeHead(502); res.end("Start npm run dev first"); });
  req.pipe(upstream);
}).listen(8888, "127.0.0.1", () => process.stdout.write("Companion QA bridge: http://localhost:8888/play\n"));
