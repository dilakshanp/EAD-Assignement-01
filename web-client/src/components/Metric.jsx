import React from "react";

export function Metric({ icon, label, value, tone }) {
  const color =
    {
      green: "text-[#087f73] bg-[#e4f3ed]",
      amber: "text-[#9a6500] bg-[#fff3d8]",
      blue: "text-[#27718b] bg-[#e4f1f5]",
      violet: "text-[#6d5b8d] bg-[#eee9f5]",
    }[tone] || "text-slate-700 bg-slate-100";
  return (
    <article className="surface grid min-h-36 content-between rounded-2xl p-5">
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
