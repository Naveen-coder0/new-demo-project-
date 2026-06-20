// Vercel Node serverless function that wraps the TanStack Start
// web-standard SSR handler (built to dist/server/server.js).
//
// All non-static requests are rewritten here (see vercel.json). We convert the
// incoming Node request into a Web `Request`, call the SSR handler's `fetch`,
// then stream the Web `Response` back through the Node response.
//
// NOTE: No `export const config = { runtime }` here. Plain Vercel functions in
// /api use the Node.js runtime by default; the Node version is pinned via the
// "engines" field in package.json. The inline `runtime` field only accepts
// Edge-style values and rejects "nodejs20.x".

let handlerPromise;

async function getHandler() {
  if (!handlerPromise) {
    // Built SSR entry (default export: { fetch }). Resolved relative to repo root.
    handlerPromise = import("../dist/server/server.js").then((m) => m.default ?? m);
  }
  return handlerPromise;
}

function buildWebRequest(req) {
  const proto = (req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = `${proto}://${host}${req.url}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, value);
  }

  const init = { method: req.method, headers };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req; // Node Readable stream
    init.duplex = "half";
  }

  return new Request(url, init);
}

export default async function handler(req, res) {
  try {
    const server = await getHandler();
    const request = buildWebRequest(req);
    const response = await server.fetch(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
    }
    res.end();
  } catch (error) {
    console.error("[vercel-ssr] handler error:", error);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end("<h1>500 — Server Error</h1>");
  }
}
