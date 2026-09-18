import React from "react";

export function Badge({ value }) {
  const text = String(value ?? "-");
  const tone = {
    active: "bg-emerald-50 text-emerald-700",
    approved: "bg-emerald-50 text-emerald-700",
    completed: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    pendingdeactivation: "bg-amber-50 text-amber-700",
    cancelled: "bg-red-50 text-red-700",
    deactivated: "bg-red-50 text-red-700",
    inactive: "bg-red-50 text-red-700",
  }[text.toLowerCase()] || "bg-slate-100 text-slate-600";
  return <span className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-bold ${tone}`}>{text}</span>;
}
