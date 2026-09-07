declare namespace App {
  interface Locals {
    user: import("@supabase/supabase-js").User | null;
    supabase: ReturnType<typeof import("@/lib/supabase").createClient>;
  }
}
