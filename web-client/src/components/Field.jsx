import React from "react";

export function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-slate-500">
      <span>{label}</span>
      {children}
    </label>
  );
}
