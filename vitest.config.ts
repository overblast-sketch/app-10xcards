import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testy integracyjne (tests/integration) ida na hostowany Supabase i czytaja .env;
// bez pliku (CI) zmienne przychodza ze srodowiska albo testy sie pomijaja.
try {
  process.loadEnvFile(".env");
} catch {
  // brak .env
}

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      reporter: ["text", "json-summary"],
    },
  },
});
