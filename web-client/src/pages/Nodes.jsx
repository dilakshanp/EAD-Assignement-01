import React, { useEffect, useState } from "react";
import { BatteryCharging, CalendarPlus, MapPin, Pencil, PowerOff, Save, Trash2 } from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Field } from "../components/Field.jsx";
import { Form } from "../components/Form.jsx";
import { PagePanel } from "../components/PagePanel.jsx";
import { asArray, request } from "../lib/api.js";
import { emptyNode } from "../lib/defaults.js";
import { formatDate } from "../lib/format.js";

function toDateTimeLocal(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function defaultSchedule() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setMinutes(0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 2);
  return { startLocal: toDateTimeLocal(start), endLocal: toDateTimeLocal(end), availableSlots: 4 };
}

function normalizeNode(node) {
  return { ...emptyNode, ...node, schedules: asArray(node.schedules) };
}

export function Nodes() {
  const role = localStorage.getItem("smartSolarRole");
  const isBackoffice = role === "Backoffice" || role === "0";
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyNode);
  const [schedule, setSchedule] = useState(defaultSchedule());
  const [message, setMessage] = useState("");
  const load = () => request("/nodes").then((data) => setRows(asArray(data))).catch((err) => { setRows([]); setMessage(err.message); });

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const result = await request(form.id ? `/nodes/${form.id}` : "/nodes", { method: form.id ? "PUT" : "POST", body: JSON.stringify(form) });
    setMessage(result.message || "Microgrid node saved.");
    if (result.success !== false) setForm(emptyNode);
    load();
  }

  async function updateSlots(node, value) {
    const result = await request(`/nodes/${node.id}/battery-slots`, { method: "PATCH", body: JSON.stringify({ batteryStorageSlots: Number(value) }) });
    setMessage(result.message || "Battery slot availability updated.");
    load();
  }

  function editNode(node) {
    setForm(normalizeNode(node));
    setMessage("Editing node. Update details or schedules and save.");
  }

  function addSchedule() {
    const nextSchedule = {
      startUtc: new Date(schedule.startLocal).toISOString(),
      endUtc: new Date(schedule.endLocal).toISOString(),
      availableSlots: Number(schedule.availableSlots),
    };
    setForm({ ...form, schedules: [...asArray(form.schedules), nextSchedule] });
    setSchedule(defaultSchedule());
    setMessage("Schedule added to the form. Save the node to persist it.");
  }

  function removeSchedule(index) {
    setForm({ ...form, schedules: asArray(form.schedules).filter((_, i) => i !== index) });
  }

  async function deactivateNode(id) {
    const result = await request(`/nodes/${id}/deactivate`, { method: "POST" });
    setMessage(result.message || "Deactivate request completed.");
    load();
  }

  return (
    <PagePanel message={message} title={isBackoffice ? "Manage Grid Hubs" : "Battery Slot Availability"} subtitle={isBackoffice ? "Backoffice manages node registration, schedules, and lifecycle." : "Grid Operators update battery slot availability and monitor operational capacity."} icon={isBackoffice ? <MapPin size={19} /> : <BatteryCharging size={19} />}>
      {isBackoffice && <>
        <Form onSubmit={save} submit={form.id ? "Update Node" : "Create Node"}>
          <Field label="Node Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Location"><input value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })} /></Field>
          <Field label="Latitude"><input type="number" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} /></Field>
          <Field label="Longitude"><input type="number" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} /></Field>
          <Field label="Capacity kWh"><input type="number" value={form.capacityKwh} onChange={(e) => setForm({ ...form, capacityKwh: Number(e.target.value) })} /></Field>
          <Field label="Battery Slots"><input type="number" value={form.batteryStorageSlots} onChange={(e) => setForm({ ...form, batteryStorageSlots: Number(e.target.value) })} /></Field>
        </Form>

        <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">Node Schedules</h3>
              <p className="text-sm text-slate-500">Add operating windows and available slot counts, then save the node.</p>
            </div>
            <Badge value={`${asArray(form.schedules).length} schedules`} />
          </div>
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
            <Field label="Schedule Start"><input type="datetime-local" value={schedule.startLocal} onChange={(e) => setSchedule({ ...schedule, startLocal: e.target.value })} /></Field>
            <Field label="Schedule End"><input type="datetime-local" value={schedule.endLocal} onChange={(e) => setSchedule({ ...schedule, endLocal: e.target.value })} /></Field>
            <Field label="Available Slots"><input type="number" value={schedule.availableSlots} onChange={(e) => setSchedule({ ...schedule, availableSlots: Number(e.target.value) })} /></Field>
            <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800" onClick={addSchedule}><CalendarPlus size={17} />Add Schedule</button>
          </div>
          {asArray(form.schedules).length > 0 && (
            <DataTable rows={asArray(form.schedules)} columns={[
              ["startUtc", "Start", formatDate],
              ["endUtc", "End", formatDate],
              ["availableSlots", "Available Slots"],
              ["actions", "Actions", (_, row) => <button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-50 px-2.5 text-xs font-semibold text-red-700" onClick={() => removeSchedule(asArray(form.schedules).indexOf(row))}><Trash2 size={15} />Remove</button>],
            ]} />
          )}
        </section>
      </>}

      <DataTable rows={rows} columns={[
        ["name", "Node"],
        ["locationName", "Location"],
        ["capacityKwh", "Capacity kWh"],
        ["batteryStorageSlots", "Slots", (v, n) => isBackoffice ? v : <SlotEditor value={v} onSave={(next) => updateSlots(n, next)} />],
        ["schedules", "Schedules", (v) => `${asArray(v).length} windows`],
        ["isActive", "State", (v) => <Badge value={v ? "Active" : "Inactive"} />],
        ["id", "Node ID"],
        ...(isBackoffice ? [["actions", "Actions", (_, n) => <div className="flex min-w-44 flex-wrap gap-1.5"><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-700" onClick={() => editNode(n)}><Pencil size={15} />Edit</button><button className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-50 px-2.5 text-xs font-semibold text-red-700" onClick={() => deactivateNode(n.id)}><PowerOff size={15} />Deactivate</button></div>]] : []),
      ]} />
    </PagePanel>
  );
}

function SlotEditor({ value, onSave }) {
  const [next, setNext] = useState(value ?? 0);
  return <div className="flex min-w-36 items-center gap-1.5"><input className="h-9 w-20" type="number" value={next} onChange={(e) => setNext(e.target.value)} /><button className="inline-flex min-h-9 items-center rounded-md bg-emerald-700 px-2.5 text-xs font-semibold text-white" onClick={() => onSave(next)}><Save size={14} /></button></div>;
}
