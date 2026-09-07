import { useMemo, useState } from "react";
import { Loader2, Sparkles, Save } from "lucide-react";
import { CandidateCard } from "@/components/generate/CandidateCard";
import { useHydrated } from "@/components/hooks/use-hydrated";
import {
  applyDecisions,
  selectCardsToSave,
  summarizeDecisions,
  toSaveDecisions,
  type GateCandidate,
} from "@/lib/services/gate";
import { sourceTextErrorMessage, validateSourceText } from "@/lib/services/validate-source-text";
import { SOURCE_TEXT_MAX, SOURCE_TEXT_MIN, type FlashcardCandidate, type Generation, type SaveDecision } from "@/types";

type Phase = "compose" | "generating" | "review" | "saving";

interface ApiError {
  error: string;
  reason?: string;
}

/**
 * S-01: wklej tekst -> kandydaci -> decyzje -> zapis do decka (FR-005..FR-012).
 * Decyzje zyja w stanie przegladarki i leca na serwer jednym zadaniem save (FR-009).
 */
export default function GenerateFlow() {
  const hydrated = useHydrated();
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("compose");
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [candidates, setCandidates] = useState<GateCandidate[]>([]);

  const validation = useMemo(() => validateSourceText(text), [text]);
  const summary = useMemo(() => summarizeDecisions(candidates), [candidates]);
  const toSave = useMemo(() => selectCardsToSave(candidates).length, [candidates]);

  function decide(decision: SaveDecision) {
    setCandidates((prev) => applyDecisions(prev, [decision]));
  }

  async function generate() {
    if (!validation.ok) {
      setError(sourceTextErrorMessage(validation.reason));
      return;
    }
    setError(null);
    setPhase("generating");
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        setError(await describeError(response));
        setPhase("compose");
        return;
      }
      const data = (await response.json()) as { generation: Generation; candidates: FlashcardCandidate[] };
      setGeneration(data.generation);
      setCandidates(
        data.candidates.map((c) => ({
          id: c.id,
          front: c.front,
          back: c.back,
          state: "pending",
          editedFront: null,
          editedBack: null,
        })),
      );
      setPhase("review");
    } catch {
      setError("Nie udało się połączyć z serwerem. Tekst został zachowany, spróbuj ponownie.");
      setPhase("compose");
    }
  }

  async function save() {
    if (!generation || toSave === 0) return;
    setError(null);
    setPhase("saving");
    try {
      const response = await fetch(`/api/generations/${generation.id}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisions: toSaveDecisions(candidates) }),
      });
      if (!response.ok) {
        setError(await describeError(response));
        setPhase("review");
        return;
      }
      window.location.assign(`/deck?saved=${generation.id}`);
    } catch {
      setError("Nie udało się zapisać. Twoje decyzje są zachowane, spróbuj ponownie.");
      setPhase("review");
    }
  }

  function startOver() {
    setGeneration(null);
    setCandidates([]);
    setPhase("compose");
    setError(null);
  }

  const length = Array.from(text.trim()).length;

  if (phase === "compose" || phase === "generating") {
    return (
      <section className="space-y-4">
        <label className="block">
          <span className="text-sm text-blue-100/70">Tekst źródłowy</span>
          <textarea
            className="mt-1 h-64 w-full rounded-xl border border-white/20 bg-black/30 p-4 text-white outline-none focus:border-purple-300"
            placeholder="Wklej fragment artykułu, rozdział dokumentacji albo notatki z kursu..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            disabled={!hydrated || phase === "generating"}
            data-testid="source-text"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`text-sm ${validation.ok ? "text-emerald-300" : "text-blue-100/60"}`}
            data-testid="char-counter"
          >
            {length} / {SOURCE_TEXT_MAX} znaków (min. {SOURCE_TEXT_MIN})
          </span>
          <button
            type="button"
            onClick={() => {
              void generate();
            }}
            disabled={!hydrated || phase === "generating"}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-60"
            data-testid="generate"
          >
            {phase === "generating" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {phase === "generating" ? "Generuję..." : "Generuj fiszki"}
          </button>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100"
            data-testid="error"
          >
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <span data-testid="review-summary">
          Kandydatów: {summary.generated}, zaakceptowanych: {summary.accepted}, po edycji: {summary.edited},
          odrzuconych: {summary.rejected}, do decyzji: {summary.pending}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startOver}
            className="rounded-lg border border-white/20 px-3 py-2 text-white hover:bg-white/10"
            data-testid="start-over"
          >
            Nowy tekst
          </button>
          <button
            type="button"
            onClick={() => {
              void save();
            }}
            disabled={toSave === 0 || phase === "saving"}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            data-testid="save-to-deck"
          >
            {phase === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Zapisz do decka ({toSave})
          </button>
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-sm text-rose-100"
          data-testid="error"
        >
          {error}
        </p>
      )}
      <ul className="space-y-3" data-testid="candidate-list">
        {candidates.map((candidate, index) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            index={index}
            onAccept={() => {
              decide({ candidate_id: candidate.id, state: "accepted" });
            }}
            onReject={() => {
              decide({ candidate_id: candidate.id, state: "rejected" });
            }}
            onReset={() => {
              decide({ candidate_id: candidate.id, state: "pending" });
            }}
            onEdit={(front, back) => {
              decide({ candidate_id: candidate.id, state: "edited", front, back });
            }}
          />
        ))}
      </ul>
    </section>
  );
}

async function describeError(response: Response): Promise<string> {
  if (response.status === 401) return "Sesja wygasła. Zaloguj się ponownie.";
  try {
    const body = (await response.json()) as ApiError;
    return body.error;
  } catch {
    return `Błąd serwera (HTTP ${String(response.status)}).`;
  }
}
