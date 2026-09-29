import React, { useEffect, useState } from "react";
import {
  BatteryCharging,
  CalendarPlus,
  MapPin,
  Pencil,
  PowerOff,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Field } from "../components/Field.jsx";
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
  return {
    startLocal: toDateTimeLocal(start),
    endLocal: toDateTimeLocal(end),
    availableSlots: 4,
  };
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
  const load = () =>
    request("/nodes")
      .then((data) => setRows(asArray(data)))
      .catch((err) => {
        setRows([]);
        setMessage(err.message);
      });

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    const result = await request(form.id ? `/nodes/${form.id}` : "/nodes", {
      method: form.id ? "PUT" : "POST",
      body: JSON.stringify(form),
    });
    setMessage(result.message || "Microgrid node saved.");
    if (result.success !== false) setForm(emptyNode);
    load();
  }

  async function updateSlots(node, value) {
    const result = await request(`/nodes/${node.id}/battery-slots`, {
      method: "PATCH",
      body: JSON.stringify({ batteryStorageSlots: Number(value) }),
    });
    setMessage(result.message || "Battery slot availability updated.");
    load();
  }

  function editNode(node) {
    setForm(normalizeNode(node));
    setMessage("Editing node. Update details or fixed slot ranges and save.");
  }

  function addSchedule() {
    const start = new Date(schedule.startLocal);
    const end = new Date(schedule.endLocal);
    const capacity = Number(schedule.availableSlots);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      setMessage("Operating window end time must be after the start time.");
      return;
    }
    if (!Number.isFinite(capacity) || capacity < 1) {
      setMessage("Bookings per slot must be at least 1.");
      return;
    }
    const nextSchedule = {
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
      availableSlots: capacity,
    };
    setForm({ ...form, schedules: [...asArray(form.schedules), nextSchedule] });
    setSchedule(defaultSchedule());
    setMessage("Fixed slot range added. Save the node to publish it.");
  }

  function removeSchedule(index) {
    setForm({
      ...form,
      schedules: asArray(form.schedules).filter((_, i) => i !== index),
    });
  }

  async function updateNodeState(id, action, fallbackMessage) {
    try {
      const result = await request(`/nodes/${id}/${action}`, {
        method: "POST",
      });
      setMessage(result.message || fallbackMessage);
      load();
    } catch (err) {
      const message = err.message || "Node status update failed.";
      setMessage(
        action === "activate" && message.includes("404")
          ? "Reactivate endpoint was not found. Restart the backend API and try again."
          : message,
      );
    }
  }

  function deactivateNode(id) {
    updateNodeState(id, "deactivate", "Node deactivated.");
  }

  function activateNode(id) {
    updateNodeState(id, "activate", "Node reactivated.");
  }

  return (
    <PagePanel
      message={message}
      title={
        isBackoffice ? "Microgrid Node Administration" : "Slot Availability"
      }
      subtitle={
        isBackoffice
          ? "Backoffice creates grid hubs, defines fixed slot ranges, and controls node lifecycle."
          : "Grid Operators update available battery slots only. Node registration and fixed slot ranges stay with Backoffice."
      }
      icon={isBackoffice ? <MapPin size={19} /> : <BatteryCharging size={19} />}
    >
      {isBackoffice && (
        <form className="grid gap-5" onSubmit={save}>
          <section className="grid gap-4 rounded-md border border-[#dbe5df] bg-[#f7faf7] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Step 1</p>
                <h3 className="text-lg font-bold text-slate-900">
                  Grid hub details
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Register the physical hub where prosumers will deliver energy.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Node Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Location">
                <input
                  value={form.locationName}
                  onChange={(e) =>
                    setForm({ ...form, locationName: e.target.value })
                  }
                />
              </Field>
              <Field label="Latitude">
                <input
                  type="number"
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({ ...form, latitude: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="number"
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({ ...form, longitude: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Capacity kWh">
                <input
                  type="number"
                  value={form.capacityKwh}
                  onChange={(e) =>
                    setForm({ ...form, capacityKwh: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Battery Slots">
                <input
                  type="number"
                  value={form.batteryStorageSlots}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      batteryStorageSlots: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
          </section>

          <section className="grid gap-4 rounded-md border border-[#dbe5df] bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">Step 2</p>
                <h3 className="text-lg font-bold text-slate-900">
                  Fixed booking slots
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a time range. The system splits it into fixed 1-hour
                  booking slots.
                </p>
              </div>
              <Badge value={`${asArray(form.schedules).length} ranges`} />
            </div>
            <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#00483d]">
              Example: 23:00 to 01:00 creates 23:00-00:00 and 00:00-01:00. If
              bookings per slot is 4, each 1-hour slot accepts four
              reservations.
            </div>
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_0.75fr_auto]">
              <Field label="Start Time">
                <input
                  type="datetime-local"
                  value={schedule.startLocal}
                  onChange={(e) =>
                    setSchedule({ ...schedule, startLocal: e.target.value })
                  }
                />
              </Field>
              <Field label="End Time">
                <input
                  type="datetime-local"
                  value={schedule.endLocal}
                  onChange={(e) =>
                    setSchedule({ ...schedule, endLocal: e.target.value })
                  }
                />
              </Field>
              <Field label="Bookings Per Slot">
                <input
                  min="1"
                  type="number"
                  value={schedule.availableSlots}
                  onChange={(e) =>
                    setSchedule({
                      ...schedule,
                      availableSlots: Number(e.target.value),
                    })
                  }
                />
              </Field>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800"
                onClick={addSchedule}
              >
                <CalendarPlus size={17} />
                Add Slot Range
              </button>
            </div>
            {asArray(form.schedules).length > 0 ? (
              <DataTable
                rows={asArray(form.schedules)}
                columns={[
                  ["startUtc", "Start", formatDate],
                  ["endUtc", "End", formatDate],
                  ["availableSlots", "Bookings Per Slot"],
                  [
                    "actions",
                    "Actions",
                    (_, row) => (
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-50 px-2.5 text-xs font-semibold text-red-700"
                        onClick={() =>
                          removeSchedule(asArray(form.schedules).indexOf(row))
                        }
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    ),
                  ],
                ]}
              />
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                No fixed slot ranges added yet.
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#dbe5df] bg-[#f7faf7] p-4">
            <p className="text-sm font-semibold text-slate-600">
              Save after adding the fixed slot ranges you want to publish.
            </p>
            <button className="inline-flex min-h-11 min-w-48 items-center justify-center gap-2 rounded-md bg-[#00483d] px-5 font-semibold text-white hover:bg-[#00372f]">
              <Save size={17} />
              {form.id ? "Update Node" : "Create Node"}
            </button>
          </div>
        </form>
      )}

      <DataTable
        rows={rows}
        columns={[
          ["name", "Node"],
          ["locationName", "Location"],
          ["capacityKwh", "Capacity kWh"],
          [
            "batteryStorageSlots",
            isBackoffice ? "Battery Slots" : "Available Slots",
            (v, n) =>
              isBackoffice ? (
                v
              ) : (
                <SlotEditor value={v} onSave={(next) => updateSlots(n, next)} />
              ),
          ],
          ...(isBackoffice
            ? [
                [
                  "schedules",
                  "Fixed Slot Ranges",
                  (v) => `${asArray(v).length} ranges`,
                ],
              ]
            : []),
          [
            "isActive",
            "State",
            (v) => <Badge value={v ? "Active" : "Inactive"} />,
          ],
          ...(isBackoffice
            ? [
                ["id", "Node ID"],
                [
                  "actions",
                  "Actions",
                  (_, n) => (
                    <NodeActions
                      node={n}
                      onEdit={() => editNode(n)}
                      onDeactivate={() => deactivateNode(n.id)}
                      onActivate={() => activateNode(n.id)}
                    />
                  ),
                ],
              ]
            : []),
        ]}
      />
    </PagePanel>
  );
}

function SlotEditor({ value, onSave }) {
  const [next, setNext] = useState(value ?? 0);
  return (
    <div className="flex min-w-36 items-center gap-1.5">
      <input
        className="h-9 w-20"
        type="number"
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <button
        className="inline-flex min-h-9 items-center rounded-md bg-emerald-700 px-2.5 text-xs font-semibold text-white"
        onClick={() => onSave(next)}
      >
        <Save size={14} />
      </button>
    </div>
  );
}

function NodeActions({ node, onEdit, onDeactivate, onActivate }) {
  const isActive = node.isActive !== false;
  return (
    <div className="flex min-w-44 flex-wrap gap-1.5">
      <button
        type="button"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        onClick={onEdit}
      >
        <Pencil size={15} />
        Edit
      </button>
      {isActive ? (
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-50 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-100"
          onClick={onDeactivate}
        >
          <PowerOff size={15} />
          Deactivate
        </button>
      ) : (
        <button
          type="button"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          onClick={onActivate}
        >
          <RotateCcw size={15} />
          Reactivate
        </button>
      )}
    </div>
  );
}
