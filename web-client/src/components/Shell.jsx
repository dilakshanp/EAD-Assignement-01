import React from "react";
import { BatteryCharging, LayoutDashboard, LogOut, MapPin, ShieldCheck, Sun, Users } from "lucide-react";
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
    <main className="grid min-h-screen bg-slate-100 text-slate-900 lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="grid gap-6 border-r border-slate-800 bg-slate-950 p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:grid-rows-[auto_1fr_auto]">
        <div className="flex items-center gap-2.5 text-xl font-bold"><Sun className="text-amber-400" size={24} /><span>SolarDesk</span></div>
        <nav className="grid content-start gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
          {nav.map(([id, label, Icon]) => (
            <button key={id} className={`relative inline-flex min-h-10 items-center justify-start gap-2 rounded-md px-3 text-sm font-semibold ${tab === id ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"}`} onClick={() => setTab(id)}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <button className="inline-flex min-h-10 items-center justify-start gap-2 rounded-md border border-slate-800 px-3 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white" onClick={onLogout}><LogOut size={18} />Logout</button>
      </aside>
      <section className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-7">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">{String(user.role)}</p>
            <h1 className="text-2xl font-bold text-slate-950">{titles[tab]}</h1>
          </div>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{user.username}</span>
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
