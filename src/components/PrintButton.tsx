"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print fixed bottom-6 right-6 bg-green text-cream px-5 py-2.5 text-sm font-serif hover:bg-green-light transition-colors"
    >
      Print / Save as PDF
    </button>
  );
}
