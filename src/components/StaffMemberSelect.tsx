"use client";

import { useState } from "react";

const STAFF_OPTIONS = ["Carla", "Ria"];

export default function StaffMemberSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const isOther = value !== "" && !STAFF_OPTIONS.includes(value);
  const [showOther, setShowOther] = useState(isOther);

  return (
    <div className="space-y-2">
      <select
        className="select"
        value={showOther ? "Other" : value || ""}
        onChange={(e) => {
          if (e.target.value === "Other") {
            setShowOther(true);
            onChange("");
          } else {
            setShowOther(false);
            onChange(e.target.value);
          }
        }}
      >
        <option value="">Select...</option>
        {STAFF_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
        <option value="Other">Other</option>
      </select>
      {showOther && (
        <input
          className="input"
          placeholder="Enter name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
