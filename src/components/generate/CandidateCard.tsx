import { useState } from "react";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import type { GateCandidate } from "@/lib/services/gate";
import { BACK_MAX, FRONT_MAX } from "@/types";

interface Props {
  candidate: GateCandidate;
  index: number;
  onAccept: () => void;
  onReject: () => void;
  onReset: () => void;
  onEdit: (front: string, back: string) => void;
}

const STATE_LABEL: Record<GateCandidate["state"], string> = {
  pending: "Do decyzji",
  accepted: "Zaakceptowana",
  edited: "Zaakceptowana po edycji",
  rejected: "Odrzucona",
};

const STATE_CLASS: Record<GateCandidate["state"], string> = {
  pending: "border-white/15 bg-white/5",
  accepted: "border-emerald-400/50 bg-emerald-500/10",
  edited: "border-sky-400/50 bg-sky-500/10",
  rejected: "border-rose-400/40 bg-rose-500/10 opacity-70",
};

export function CandidateCard({ candidate, index, onAccept, onReject, onReset, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [front, setFront] = useState(candidate.editedFront ?? candidate.front);
  const [back, setBack] = useState(candidate.editedBack ?? candidate.back);

  const frontLen = Array.from(front.trim()).length;
  const backLen = Array.from(back.trim()).length;
  const editValid = frontLen >= 1 && frontLen <= FRONT_MAX && backLen >= 1 && backLen <= BACK_MAX;

  const shownFront = candidate.state === "edited" && candidate.editedFront ? candidate.editedFront : candidate.front;
  const shownBack = candidate.state === "edited" && candidate.editedBack ? candidate.editedBack : candidate.back;

  return (
    <li
      className={`rounded-xl border p-4 transition-colors ${STATE_CLASS[candidate.state]}`}
      data-testid="candidate"
      data-state={candidate.state}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-blue-100/60">
        <span>Kandydat {index + 1}</span>
        <span data-testid="candidate-state">{STATE_LABEL[candidate.state]}</span>
      </div>

      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!editValid) return;
            onEdit(front.trim(), back.trim());
            setEditing(false);
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
              data-testid="edit-front"
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
              data-testid="edit-back"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!editValid}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              data-testid="edit-save"
            >
              Zapisz zmiany i akceptuj
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/10"
              onClick={() => {
                setEditing(false);
              }}
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="font-semibold text-white" data-testid="candidate-front">
            {shownFront}
          </p>
          <p className="mt-1 text-sm text-blue-100/80" data-testid="candidate-back">
            {shownBack}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {candidate.state === "pending" ? (
              <>
                <ActionButton onClick={onAccept} testId="accept" className="bg-emerald-600 hover:bg-emerald-500">
                  <Check className="size-4" /> Akceptuj
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    setEditing(true);
                  }}
                  testId="edit"
                  className="bg-sky-600 hover:bg-sky-500"
                >
                  <Pencil className="size-4" /> Edytuj
                </ActionButton>
                <ActionButton onClick={onReject} testId="reject" className="bg-rose-700 hover:bg-rose-600">
                  <X className="size-4" /> Odrzuć
                </ActionButton>
              </>
            ) : (
              <ActionButton onClick={onReset} testId="reset" className="border border-white/20 hover:bg-white/10">
                <RotateCcw className="size-4" /> Cofnij decyzję
              </ActionButton>
            )}
          </div>
        </>
      )}
    </li>
  );
}

function ActionButton({
  onClick,
  testId,
  className,
  children,
}: {
  onClick: () => void;
  testId: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
