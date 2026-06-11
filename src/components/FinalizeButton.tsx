"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FinalizeButton({
  endpoint,
  finalized,
  label,
  finalizedLabel,
}: {
  endpoint: string;
  finalized: boolean;
  label: string;
  finalizedLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (finalized) {
    return (
      <span className="inline-flex items-center text-xs px-2 py-1 bg-green text-cream uppercase tracking-widest">
        {finalizedLabel}
      </span>
    );
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className="btn-primary text-sm">
        {loading ? "Sending…" : label}
      </button>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
