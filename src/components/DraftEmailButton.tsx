"use client";

import { useState } from "react";
import DraftEmailModal, { EmailDraft } from "./DraftEmailModal";

export interface DraftOption {
  label: string;
  kind: string;
}

export default function DraftEmailButton({
  label,
  options,
  payload,
}: {
  label: string;
  options: DraftOption[];
  payload: Record<string, unknown>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(kind: string) {
    setMenuOpen(false);
    setModalOpen(true);
    setLoading(true);
    setError(null);
    setDraft(null);
    try {
      const res = await fetch("/api/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate draft");
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      {options.length === 1 ? (
        <button onClick={() => handleSelect(options[0].kind)} className="btn-secondary text-sm">
          {label}
        </button>
      ) : (
        <>
          <button onClick={() => setMenuOpen((v) => !v)} className="btn-secondary text-sm">
            {label} ▾
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-1 bg-white border border-cream-dark shadow-lg z-20 min-w-[180px]">
                {options.map((o) => (
                  <button
                    key={o.kind}
                    onClick={() => handleSelect(o.kind)}
                    className="block w-full text-left px-3 py-2 text-sm text-green hover:bg-cream"
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {modalOpen && (
        <DraftEmailModal draft={draft} loading={loading} error={error} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
