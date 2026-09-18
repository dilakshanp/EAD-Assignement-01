import React from "react";

export function Metric({ icon, label, value, tone }) {
  const color = { green: "text-emerald-700 bg-emerald-50", amber: "text-amber-700 bg-amber-50", blue: "text-sky-700 bg-sky-50", violet: "text-violet-700 bg-violet-50" }[tone] || "text-slate-700 bg-slate-100";
  return (
    <article className="grid min-h-32 content-between rounded-lg border border-slate-200 bg-white p-5">
      <span className={`grid size-10 place-items-center rounded-lg ${color}`}>{icon}</span>
      <span className="text-sm text-slate-500">{label}</span>
      <strong className="text-4xl leading-none text-slate-950">{value}</strong>
    </article>
  );
}
