import { AI_PROVIDER, OPENROUTER_API_KEY, OPENROUTER_MODEL } from "astro:env/server";
import { MockProvider } from "@/lib/ai/mock-provider";
import { OpenRouterProvider } from "@/lib/ai/openrouter-provider";
import type { AiProvider } from "@/lib/ai/provider";

/** Fabryka dostawcy AI wg konfiguracji srodowiska (jedyne miejsce z astro:env w src/lib/ai). */
export function getAiProvider(): AiProvider {
  if (AI_PROVIDER === "openrouter") {
    return new OpenRouterProvider({
      apiKey: OPENROUTER_API_KEY ?? "",
      model: OPENROUTER_MODEL ?? "",
      appTitle: "10xCards",
    });
  }
  return new MockProvider();
}
