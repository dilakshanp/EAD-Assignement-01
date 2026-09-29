import React from "react";

export function Metric({ icon, label, value, tone }) {
  const color =
    {
      green: "text-[#00483d] bg-[#edf5df]",
      amber: "text-[#536400] bg-[#f4f8d9]",
      blue: "text-[#315f68] bg-[#e6f0ee]",
      violet: "text-[#38414f] bg-[#edf0f0]",
    }[tone] || "text-slate-700 bg-slate-100";
  return (
    <article className="surface grid min-h-36 content-between rounded-md p-5">
      <div className="flex items-start justify-between">
        <span className={`grid size-10 place-items-center rounded-xl ${color}`}>
          {icon}
        </span>
        <span className="text-xs font-bold text-[#9aaba6]">LIVE</span>
      </div>
      <span className="text-sm font-semibold text-[#657778]">{label}</span>
      <strong className="text-4xl leading-none tracking-tight text-[#102a2b]">
        {value}
      </strong>
    </article>
  );
}
