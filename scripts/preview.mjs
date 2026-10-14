import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const port = Number(process.env.PORT || 8741);
const prefix = "/Public-service-ai-observatory";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function resolveFile(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  if (pathname === "/" || pathname === "") return { redirect: `${prefix}/` };
  if (pathname === prefix) return { redirect: `${prefix}/` };
  if (!pathname.startsWith(`${prefix}/`)) return { missing: true };
  let relative = pathname.slice(prefix.length);
  if (!relative || relative === "/") relative = "/index.html";
  else if (relative.endsWith("/")) relative += "index.html";
  const file = path.normalize(path.join(dist, relative));
  if (!file.startsWith(dist)) return { missing: true };
  return { file };
}

const server = http.createServer((request, response) => {
  const located = resolveFile(request.url || "/");
  if (located.redirect) {
    response.writeHead(302, { Location: located.redirect });
    response.end();
    return;
  }
  const send404 = () => {
    const fallback = path.join(dist, "404.html");
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(fs.readFileSync(fallback));
  };
  if (located.missing || !fs.existsSync(located.file) || fs.statSync(located.file).isDirectory()) {
    send404();
    return;
  }
  const extension = path.extname(located.file);
  response.writeHead(200, {
    "Content-Type": types[extension] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  response.end(fs.readFileSync(located.file));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Preview at http://127.0.0.1:${port}${prefix}/`);
});
