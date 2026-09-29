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
      const result = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (result.success) onLogin(result.data);
      else setError(result.message || "Login failed");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f7f3] p-4 text-slate-900 md:p-8 lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden rounded-md bg-[#00483d] p-10 text-white lg:grid lg:content-between">
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-md bg-[#d9ff3f] text-[#0b1020]">
            <Sun size={24} />
          </span>
          <strong className="text-xl">Resolar</strong>
        </div>
        <div className="relative max-w-xl">
          <p className="eyebrow !text-[#d9ff3f]">Microgrid operations</p>
          <h2 className="mt-4 text-5xl font-bold leading-[1.02] tracking-tight">
            A clearer view of every watt in motion.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-teal-50/65">
            Coordinate nodes, prosumers, reservations, and verified energy
            transfers from one calm operational workspace.
          </p>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <strong className="text-2xl text-[#d9ff3f]">24/7</strong>
            <p className="mt-1 text-xs text-teal-50/55">network visibility</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <strong className="text-2xl text-[#d9ff3f]">Live</strong>
            <p className="mt-1 text-xs text-teal-50/55">booking status</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-4">
            <strong className="text-2xl text-[#d9ff3f]">1</strong>
            <p className="mt-1 text-xs text-teal-50/55">central service</p>
          </div>
        </div>
      </section>
      <section className="grid min-h-[calc(100vh-2rem)] place-items-center p-5 md:p-12">
        <div className="grid w-full max-w-md gap-7">
          <div className="lg:hidden">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-md bg-[#d9ff3f] text-[#0b1020]">
                <Sun size={24} />
              </span>
              <strong className="text-xl text-[#102a2b]">SolarDesk</strong>
            </div>
          </div>
          <div>
            <p className="eyebrow">Secure workspace</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-[#102a2b]">
              Welcome back.
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#657778]">
              Sign in to manage the microgrid network.
            </p>
          </div>
        </div>
        <form
          onSubmit={submit}
          className="grid gap-4 rounded-md border border-[#dbe5df] bg-white p-6 md:p-8"
        >
          <Field label="Username">
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}
          <button
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#00483d] px-4 font-semibold text-white hover:bg-[#00372f] disabled:cursor-wait disabled:opacity-70"
            disabled={loading}
          >
            <LogIn size={17} />
            {loading ? "Signing in..." : "Enter workspace"}
          </button>
        </form>
        <p className="text-center text-xs font-semibold text-[#9aaba6]">
          Centralized service · Role-based access · Secure transfers
        </p>
      </section>
    </main>
  );
}
