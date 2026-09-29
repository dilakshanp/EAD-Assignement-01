import React from "react";

export function PagePanel({ title, subtitle, icon, message, children }) {
  return (
    <div className="grid gap-5 p-4 md:p-8 md:pt-2">
      <section className="surface grid gap-6 rounded-md p-5 md:p-7">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-md bg-[#edf5df] text-[#00483d]">
            {icon}
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#102a2b]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-[#657778]">{subtitle}</p>
            )}
          </div>
        </div>
        {message && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            {message}
          </p>
        )}
        {children}
      </section>
    </div>
  );
}
