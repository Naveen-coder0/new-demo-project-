// @lovable.dev/vite-tanstack-config bundles the Cloudflare Worker build by default.
// On Vercel we disable it so TanStack Start emits a plain web-standard SSR handler
// (dist/server/server.js) that the Vercel serverless function in /api wraps.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = !!process.env.VERCEL || process.env.DEPLOY_TARGET === "vercel";

export default defineConfig({
  cloudflare: isVercel ? false : undefined,
  tanstackStart: {
    server: { entry: "server" },
  },
});


