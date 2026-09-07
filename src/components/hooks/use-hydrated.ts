import { useSyncExternalStore } from "react";

// Stan hydracji nigdy sie nie zmienia po zamontowaniu, wiec subskrypcja jest pusta.
const subscribe = () => () => undefined;

/**
 * True dopiero po zamontowaniu wyspy w przegladarce (false w SSR i podczas
 * hydracji). Formularze blokuja pola do tego momentu: wpis do pola przed
 * hydracja jest gubiony, bo React nadpisuje DOM stanem poczatkowym
 * (wyscig widoczny w e2e, plan 0002).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
