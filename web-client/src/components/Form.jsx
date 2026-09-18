import React from "react";
import { Save } from "lucide-react";

export function Form({ children, onSubmit, submit }) {
  return (
    <form className="grid grid-cols-1 items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={onSubmit}>
      {children}
      <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800">
        <Save size={17} />{submit}
      </button>
    </form>
  );
}
