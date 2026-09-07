// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://app-10xcards.tomasz-sinkiewicz.workers.dev",
  output: "server",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare(),
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "secret", optional: true }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      // Dostawca AI (tech-stack D4): "mock" bez sieci, "openrouter" z kluczem.
      // access: "secret" celowo takze dla zmiennych niesekretnych: "public" jest
      // wstrzykiwane w czasie builda z .env, a produkcja ma czytac bindingi
      // Cloudflare w czasie dzialania (lekcja 2026-09-07, plan 0902).
      AI_PROVIDER: envField.string({ context: "server", access: "secret", optional: true }),
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      OPENROUTER_MODEL: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
