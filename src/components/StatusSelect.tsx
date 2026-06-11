"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StatusSelect({
  endpoint,
  value,
  options,
  colorClass,
}: {
  endpoint: string;
  value: string;
  options: { value: string; label: string }[];
  colorClass?: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    const previous = current;
    setCurrent(newStatus);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      router.refresh();
    } catch (err) {
      setCurrent(previous);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <select
        className={`select w-auto text-xs py-1 ${colorClass ?? ""}`}
        value={current}
        onChange={handleChange}
        disabled={loading}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
}
