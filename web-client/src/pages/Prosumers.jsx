import React, { useEffect, useState } from "react";
import { CheckCircle2, Pencil, UserX, Users } from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Field } from "../components/Field.jsx";
import { Form } from "../components/Form.jsx";
import { PagePanel } from "../components/PagePanel.jsx";
import { asArray, request } from "../lib/api.js";
import { emptyProsumer } from "../lib/defaults.js";

export function Prosumers() {
  const [rows, setRows] = useState([]);
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

  return (
    <PagePanel message={message} title="Register And Maintain Prosumers" subtitle="NIC is the primary key for each solar prosumer profile." icon={<Users size={19} />}>
      <Form onSubmit={save} submit="Save Prosumer">
        <Field label="NIC"><input value={form.nic} onChange={(e) => setForm({ ...form, nic: e.target.value })} /></Field>
        <Field label="Full Name"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
        <Field label="Solar Capacity kW"><input type="number" value={form.solarCapacityKw} onChange={(e) => setForm({ ...form, solarCapacityKw: Number(e.target.value) })} /></Field>
      </Form>
      <DataTable rows={rows} columns={[
        ["nic", "NIC"],
        ["fullName", "Name"],
        ["email", "Email"],
        ["solarCapacityKw", "Solar kW"],
        ["status", "Status", (v) => <Badge value={v} />],
        ["actions", "Actions", (_, p) => <div className="flex min-w-48 flex-wrap gap-1.5"><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-700" onClick={() => setForm(p)}><Pencil size={15} />Edit</button><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700" onClick={() => status(p.nic, "activate")}><CheckCircle2 size={15} />Activate</button><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-50 px-2.5 text-xs font-semibold text-red-700" onClick={() => status(p.nic, "deactivate")}><UserX size={15} />Deactivate</button></div>],
      ]} />
    </PagePanel>
  );
}
