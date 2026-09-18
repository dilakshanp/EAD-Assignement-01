import React from "react";

export function DataTable({ rows, columns }) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[860px] border-collapse bg-white">
        <thead>
          <tr>{columns.map(([, label]) => <th className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-3.5 py-3 text-left text-xs font-bold uppercase text-slate-500" key={label}>{label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">No records found</td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr className="hover:bg-slate-50" key={row.id || row.nic || row.username || i}>
              {columns.map(([key, label, render]) => (
                <td className="border-b border-slate-100 px-3.5 py-3 text-sm text-slate-700" key={label}>{render ? render(row[key], row) : String(row[key] ?? "-")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
