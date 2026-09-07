import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { BACK_MAX, FRONT_MAX, type Flashcard } from "@/types";

interface Props {
  initialCards: Flashcard[];
}

const dateFormat = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });

/** S-02: lista fiszek z edycja inline i usuwaniem z potwierdzeniem (FR-013..FR-016). */
export default function DeckList({ initialCards }: Props) {
  const [cards, setCards] = useState(initialCards);

  if (cards.length === 0) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-blue-100/70" data-testid="deck-empty">
        Deck jest pusty.{" "}
        <a href="/generate" className="text-purple-300 hover:underline">
          Wygeneruj pierwsze fiszki
        </a>
        .
      </p>
    );
  }

  return (
    <ul className="space-y-3" data-testid="deck-list">
      {cards.map((card) => (
        <DeckCard
          key={card.id}
          card={card}
          onUpdated={(updated) => {
            setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          }}
          onDeleted={() => {
            setCards((prev) => prev.filter((c) => c.id !== card.id));
          }}
        />
      ))}
    </ul>
  );
}

function DeckCard({
  card,
  onUpdated,
  onDeleted,
}: {
  card: Flashcard;
  onUpdated: (card: Flashcard) => void;
  onDeleted: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frontLen = Array.from(front.trim()).length;
  const backLen = Array.from(back.trim()).length;
  const valid = frontLen >= 1 && frontLen <= FRONT_MAX && backLen >= 1 && backLen <= BACK_MAX;

  async function save() {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/flashcards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front: front.trim(), back: back.trim() }),
      });
      if (!response.ok) {
        setError(await describeError(response));
        return;
      }
      onUpdated((await response.json()) as Flashcard);
      setMode("view");
    } catch {
      setError("Nie udało się zapisać. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/flashcards/${card.id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) {
        setError(await describeError(response));
        return;
      }
      onDeleted();
    } catch {
      setError("Nie udało się usunąć. Spróbuj ponownie.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl border border-white/10 bg-white/5 p-4" data-testid="flashcard" data-id={card.id}>
      {mode === "edit" ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="block text-sm">
            <span className="text-blue-100/70">
              Przód ({frontLen}/{FRONT_MAX})
            </span>
            <input
              className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-purple-300"
              value={front}
              maxLength={FRONT_MAX}
              onChange={(e) => {
                setFront(e.target.value);
              }}
              data-testid="card-edit-front"
            />
          </label>
          <label className="block text-sm">
            <span className="text-blue-100/70">
              Tył ({backLen}/{BACK_MAX})
            </span>
            <textarea
              className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white outline-none focus:border-purple-300"
              rows={3}
              value={back}
              maxLength={BACK_MAX}
              onChange={(e) => {
                setBack(e.target.value);
              }}
              data-testid="card-edit-back"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!valid || busy}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              data-testid="card-save"
            >
              {busy ? "Zapisuję..." : "Zapisz"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
              onClick={() => {
                setFront(card.front);
                setBack(card.back);
                setMode("view");
                setError(null);
              }}
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="font-semibold" data-testid="flashcard-front">
            {card.front}
          </p>
          <p className="mt-1 text-sm text-blue-100/80" data-testid="flashcard-back">
            {card.back}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="mr-auto text-xs text-blue-100/50">{dateFormat.format(new Date(card.created_at))}</span>
            {mode === "confirm-delete" ? (
              <>
                <span className="text-rose-200">Usunąć tę fiszkę?</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void remove();
                  }}
                  className="rounded-lg bg-rose-700 px-3 py-1.5 font-medium text-white hover:bg-rose-600 disabled:opacity-50"
                  data-testid="card-confirm-delete"
                >
                  {busy ? "Usuwam..." : "Usuń"}
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-white hover:bg-white/10"
                  onClick={() => {
                    setMode("view");
                    setError(null);
                  }}
                >
                  Anuluj
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-white hover:bg-white/10"
                  onClick={() => {
                    setMode("edit");
                  }}
                  data-testid="card-edit"
                >
                  <Pencil className="size-4" /> Edytuj
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 px-3 py-1.5 text-rose-100 hover:bg-rose-500/10"
                  onClick={() => {
                    setMode("confirm-delete");
                  }}
                  data-testid="card-delete"
                >
                  <Trash2 className="size-4" /> Usuń
                </button>
              </>
            )}
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-200" data-testid="card-error">
          {error}
        </p>
      )}
    </li>
  );
}

async function describeError(response: Response): Promise<string> {
  if (response.status === 401) return "Sesja wygasła. Zaloguj się ponownie.";
  try {
    const body = (await response.json()) as { error: string };
    return body.error;
  } catch {
    return `Błąd serwera (HTTP ${String(response.status)}).`;
  }
}
