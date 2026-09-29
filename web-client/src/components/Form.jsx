import React from "react";
import { Save } from "lucide-react";

export function Form({ children, onSubmit, submit }) {
  return (
    <form
      className="grid grid-cols-1 items-end gap-4 rounded-2xl border border-[#dbe5df] bg-[#f7faf7] p-5 md:grid-cols-2 xl:grid-cols-3"
      onSubmit={onSubmit}
    >
      {children}
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#087f73] px-4 font-semibold text-white shadow-lg shadow-[#087f73]/15 hover:bg-[#075c58]">
        <Save size={17} />
        {submit}
      </button>
    </form>
  );
}
