import React from "react";
import { Save } from "lucide-react";

export function Form({ children, onSubmit, submit }) {
  return (
    <form
      className="grid grid-cols-1 items-end gap-4 rounded-md border border-[#dbe5df] bg-[#f7faf7] p-5 md:grid-cols-2 xl:grid-cols-3"
      onSubmit={onSubmit}
    >
      {children}
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#00483d] px-4 font-semibold text-white hover:bg-[#00372f]">
        <Save size={17} />
        {submit}
      </button>
    </form>
  );
}
