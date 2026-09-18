import React from "react";

export function PagePanel({ title, subtitle, icon, message, children }) {
  return (
    <div className="grid gap-5 p-4 md:p-7">
      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{icon}</span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {message && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{message}</p>}
        {children}
      </section>
    </div>
  );
}
