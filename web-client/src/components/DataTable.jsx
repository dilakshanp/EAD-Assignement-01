import React from "react";

export function DataTable({ rows, columns }) {
  return (
    <div className="w-full overflow-auto rounded-2xl border border-[#dbe5df]">
      <table className="w-full min-w-[860px] border-collapse bg-white">
        <thead>
          <tr>
            {columns.map(([, label]) => (
              <th
                className="sticky top-0 z-10 border-b border-[#dbe5df] bg-[#f7faf7] px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#657778]"
                key={label}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-slate-500"
              >
                No records found
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              className="hover:bg-[#f7faf7]"
              key={row.id || row.nic || row.username || i}
            >
              {columns.map(([key, label, render]) => (
                <td
                  className="border-b border-[#edf2ee] px-4 py-3.5 text-sm text-[#405857]"
                  key={label}
                >
                  {render ? render(row[key], row) : String(row[key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
