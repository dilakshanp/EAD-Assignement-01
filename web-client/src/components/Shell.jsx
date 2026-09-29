import React from "react";
import {
  BatteryCharging,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
  Sun,
  Users,
} from "lucide-react";
import { Dashboard } from "../pages/Dashboard.jsx";
import { Nodes } from "../pages/Nodes.jsx";
import { Prosumers } from "../pages/Prosumers.jsx";
import { Reservations } from "../pages/Reservations.jsx";
import { UsersPanel } from "../pages/UsersPanel.jsx";

const titles = {
  dashboard: "Operations Dashboard",
  users: "User Administration",
  prosumers: "Prosumer Accounts",
  nodes: "Microgrid Nodes",
  reservations: "Energy Reservations",
};

export function Shell({ user, tab, setTab, onLogout }) {
  const isBackoffice = user.role === "Backoffice" || user.role === 0;
  const nav = [
    ["dashboard", "Dashboard", LayoutDashboard],
    ...(isBackoffice ? [["users", "Users", ShieldCheck]] : []),
    ...(isBackoffice ? [["prosumers", "Prosumers", Users]] : []),
    ["nodes", "Grid Nodes", MapPin],
    ["reservations", "Reservations", BatteryCharging],
  ];

  return (
    <main className="grid min-h-screen text-slate-900 lg:grid-cols-[286px_minmax(0,1fr)]">
      <aside className="grid gap-8 bg-[#102a2b] p-5 text-white lg:sticky lg:top-0 lg:h-screen lg:grid-rows-[auto_1fr_auto]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#f2b84b] text-[#102a2b]">
            <Sun size={22} />
          </span>
          <span>
            <strong className="block text-lg tracking-tight">SolarDesk</strong>
            <small className="text-xs text-teal-100/60">
              Microgrid control room
            </small>
          </span>
        </div>
        <nav className="grid content-start gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              className={`group relative inline-flex min-h-12 items-center justify-start gap-3 rounded-xl px-3.5 text-sm font-semibold ${tab === id ? "bg-white text-[#102a2b] shadow-lg shadow-black/10" : "text-teal-50/65 hover:bg-white/10 hover:text-white"}`}
              onClick={() => setTab(id)}
            >
              <Icon size={18} />{" "}
              <span className="flex-1 text-left">{label}</span>
              {tab === id && <ChevronRight size={16} />}
            </button>
          ))}
        </nav>
        <div className="grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="eyebrow !text-[#f2b84b]">Signed in as</p>
            <p className="mt-1 truncate text-sm font-semibold">
              {user.username}
            </p>
            <p className="mt-0.5 text-xs text-teal-50/55">
              {String(user.role)}
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center justify-start gap-3 rounded-xl px-3.5 text-sm font-semibold text-teal-50/65 hover:bg-white/10 hover:text-white"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-24 items-center justify-between gap-4 border-b border-[#dbe5df]/80 bg-[#f4f7f3]/90 px-5 py-5 backdrop-blur-md md:px-9">
          <div>
            <p className="eyebrow">Operations / {String(user.role)}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#102a2b]">
              {titles[tab]}
            </h1>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.12)]" />
            <span className="text-sm font-semibold text-[#657778]">
              Service online
            </span>
          </div>
        </header>
        {tab === "dashboard" && <Dashboard />}
        {tab === "users" && <UsersPanel />}
        {tab === "prosumers" && <Prosumers />}
        {tab === "nodes" && <Nodes />}
        {tab === "reservations" && <Reservations />}
      </section>
    </main>
  );
}
