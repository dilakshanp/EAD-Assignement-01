import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Filter, Pencil, RotateCcw, UserX, Users } from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Field } from "../components/Field.jsx";
import { Form } from "../components/Form.jsx";
import { PagePanel } from "../components/PagePanel.jsx";
import { asArray, request } from "../lib/api.js";
import { emptyProsumer } from "../lib/defaults.js";

export function Prosumers() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyProsumer);
  const [message, setMessage] = useState("");
  const load = () => request("/prosumers").then((data) => setRows(asArray(data))).catch((err) => setMessage(err.message));

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const result = await request(`/prosumers/${form.nic}`, { method: "PUT", body: JSON.stringify(form) });
    setMessage(result.message || "Prosumer saved.");
    setForm(emptyProsumer);
    load();
  }

  async function status(nic, action) {
    const result = await request(`/prosumers/${nic}/${action}`, { method: "POST" });
    setMessage(result.message || "Prosumer status updated.");
    load();
  }

  const pendingCount = rows.filter((p) => p.status === "PendingDeactivation" || p.status === 1).length;
  const filteredRows = useMemo(() => {
    if (filter === "pending") return rows.filter((p) => p.status === "PendingDeactivation" || p.status === 1);
    if (filter === "active") return rows.filter((p) => p.status === "Active" || p.status === 0);
    if (filter === "deactivated") return rows.filter((p) => p.status === "Deactivated" || p.status === 2);
    return rows;
  }, [rows, filter]);

  return (
    <PagePanel message={message} title="Register And Maintain Prosumers" subtitle="NIC is the primary key. Pending deactivation requests are visible and actionable here." icon={<Users size={19} />}>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><Filter size={16} />Account Filter</span>
        <button className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`} onClick={() => setFilter("all")}>All</button>
        <button className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === "pending" ? "bg-amber-600 text-white" : "bg-white text-slate-700"}`} onClick={() => setFilter("pending")}>Pending ({pendingCount})</button>
        <button className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === "active" ? "bg-emerald-700 text-white" : "bg-white text-slate-700"}`} onClick={() => setFilter("active")}>Active</button>
        <button className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === "deactivated" ? "bg-red-700 text-white" : "bg-white text-slate-700"}`} onClick={() => setFilter("deactivated")}>Deactivated</button>
      </div>

      <Form onSubmit={save} submit="Save Prosumer">
        <Field label="NIC"><input value={form.nic} onChange={(e) => setForm({ ...form, nic: e.target.value })} /></Field>
        <Field label="Full Name"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="Solar Capacity kW"><input type="number" value={form.solarCapacityKw} onChange={(e) => setForm({ ...form, solarCapacityKw: Number(e.target.value) })} /></Field>
      </Form>
      <DataTable rows={filteredRows} columns={[
        ["nic", "NIC"],
        ["fullName", "Name"],
        ["email", "Email"],
        ["solarCapacityKw", "Solar kW"],
        ["status", "Status", (v) => <Badge value={v} />],
        ["actions", "Actions", (_, p) => <div className="flex min-w-56 flex-wrap gap-1.5"><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-700" onClick={() => setForm(p)}><Pencil size={15} />Edit</button><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700" onClick={() => status(p.nic, "activate")}><CheckCircle2 size={15} />Activate</button><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-50 px-2.5 text-xs font-semibold text-red-700" onClick={() => status(p.nic, "deactivate")}><UserX size={15} />Deactivate</button><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-amber-50 px-2.5 text-xs font-semibold text-amber-700" onClick={() => status(p.nic, "activate")}><RotateCcw size={15} />Approve Pending</button></div>],
      ]} />
    </PagePanel>
  );
}
