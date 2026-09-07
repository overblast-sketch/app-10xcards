import { defineMiddleware } from "astro:middleware";
import { createClient } from "@/lib/supabase";

/** Strony produktu: niezalogowany jest przekierowany na logowanie (FR-003). */
const PROTECTED_PAGES = ["/generate", "/deck"];
/** Trasy API produktu: niezalogowany dostaje 401 JSON, nie redirect. */
const PROTECTED_API = ["/api/generations", "/api/flashcards"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }
  context.locals.supabase = supabase;

  const path = context.url.pathname;

  if (PROTECTED_API.some((route) => path.startsWith(route)) && !context.locals.user) {
    return new Response(JSON.stringify({ error: "Wymagane logowanie" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (PROTECTED_PAGES.some((route) => path.startsWith(route)) && !context.locals.user) {
    return context.redirect("/auth/signin");
  }

  // Zalogowany nie potrzebuje landingu ani ekranow logowania.
  if ((path === "/" || path === "/auth/signin" || path === "/auth/signup") && context.locals.user) {
    return context.redirect("/generate");
  }

  return next();
});
