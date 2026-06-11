"use client";

import { useState } from "react";

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

export default function DraftEmailModal({
  draft,
  loading,
  error,
  onClose,
}: {
  draft: EmailDraft | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!draft) return;
    const text = `To: ${draft.to}\nSubject: ${draft.subject}\n\n${draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white border border-cream-dark max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h2 className="section-title mb-0">Email Draft</h2>
          <button onClick={onClose} className="text-green-muted hover:text-green text-sm">
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-green-muted">Generating draft…</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}

        {draft && !loading && !error && (
          <div className="space-y-4">
            <div className="field">
              <label className="label">To</label>
              <input className="input" readOnly value={draft.to} />
            </div>
            <div className="field">
              <label className="label">Subject</label>
              <input className="input" readOnly value={draft.subject} />
            </div>
            <div className="field">
              <label className="label">Body</label>
              <textarea className="input min-h-[240px] whitespace-pre-wrap" readOnly value={draft.body} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleCopy} className="btn-primary text-sm">
                {copied ? "Copied!" : "Copy to clipboard"}
              </button>
              <button onClick={onClose} className="btn-secondary text-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
