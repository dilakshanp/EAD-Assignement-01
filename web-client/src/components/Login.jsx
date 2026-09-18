import React, { useState } from "react";
import { LogIn, Sun } from "lucide-react";
import { Field } from "./Field.jsx";
import { request } from "../lib/api.js";

export function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await request("/auth/login", { method: "POST", body: JSON.stringify(form) });
      if (result.success) onLogin(result.data);
      else setError(result.message || "Login failed");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6 text-slate-900">
      <section className="grid w-full max-w-md gap-5 rounded-lg border border-slate-200 bg-white p-8">
        <div className="grid size-14 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Sun size={30} /></div>
        <div>
          <p className="text-xs font-bold uppercase text-slate-500">Enterprise Energy Desk</p>
          <h1 className="mt-1 text-3xl font-bold leading-tight">Smart Solar Microgrid Trading System</h1>
        </div>
        <form onSubmit={submit} className="grid gap-3.5">
          <Field label="Username">
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </Field>
          <Field label="Password">
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70" disabled={loading}><LogIn size={17} />{loading ? "Signing in..." : "Sign in"}</button>
        </form>
      </section>
    </main>
  );
}
