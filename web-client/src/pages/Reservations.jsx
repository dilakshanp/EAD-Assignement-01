import React, { useEffect, useMemo, useState } from "react";
import {
  BatteryCharging,
  Ban,
  CheckCircle2,
  Pencil,
  QrCode,
  RotateCcw,
  ScanLine,
  Search,
} from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Field } from "../components/Field.jsx";
import { Form } from "../components/Form.jsx";
import { PagePanel } from "../components/PagePanel.jsx";
import { asArray, request } from "../lib/api.js";
import { formatDate } from "../lib/format.js";

function toDateInput(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function defaultBookingDate() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return toDateInput(next);
}

function dotnetTicks(value) {
  const milliseconds = BigInt(new Date(value).getTime());
  return (milliseconds * 10000n + 621355968000000000n).toString();
}

function slotIdFromReservation(reservation) {
  if (!reservation?.nodeId || !reservation?.slotStartUtc) return "";
  return `${reservation.nodeId}:${dotnetTicks(reservation.slotStartUtc)}`;
}

function createDefaultReservationForm() {
  return {
    id: "",
    prosumerNic: "",
    nodeId: "",
    bookingDate: defaultBookingDate(),
    slotId: "",
    energyKwh: 5,
    status: "Approved",
  };
}

function reservationToForm(reservation) {
  return {
    id: reservation.id || "",
    prosumerNic: reservation.prosumerNic || "",
    nodeId: reservation.nodeId || "",
    bookingDate: reservation.slotStartUtc
      ? toDateInput(new Date(reservation.slotStartUtc))
      : defaultBookingDate(),
    slotId: slotIdFromReservation(reservation),
    energyKwh: reservation.energyKwh || 5,
    status: reservation.status || "Approved",
  };
}

function slotAvailable(slot) {
  return Boolean(slot?.isAvailable) && Number(slot?.remainingSlots || 0) > 0;
}

function slotTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function slotLabel(slot, form) {
  const isCurrent = Boolean(form.id && form.slotId && slot.slotId === form.slotId);
  const available = slotAvailable(slot);
  const booked = Number(slot.bookedSlots || 0);
  const remaining = Number(slot.remainingSlots || 0);
  const state = isCurrent
    ? "Current booking"
    : available
      ? `Available - ${remaining} left${booked > 0 ? ` / ${booked} booked` : ""}`
      : "Booked";
  return `${slotTime(slot.startUtc)} - ${slotTime(slot.endUtc)} | ${state}`;
}

function canSelectSlot(slot, form) {
  return slotAvailable(slot) || Boolean(form.id && form.slotId && slot.slotId === form.slotId);
}

export function Reservations() {
  const role = localStorage.getItem("smartSolarRole");
  const canApprove =
    role === "Backoffice" ||
    role === "GridOperator" ||
    role === "0" ||
    role === "1";
  const [rows, setRows] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [query, setQuery] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(createDefaultReservationForm());
  const [slots, setSlots] = useState([]);
  const [slotMessage, setSlotMessage] = useState(
    "Select a grid node and date to view slots.",
  );
  const minDate = toDateInput(new Date());
  const maxDate = toDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const load = () =>
    request("/reservations")
      .then((data) => setRows(asArray(data)))
      .catch((err) => {
        setRows([]);
        setMessage(err.message);
      });

  const loadNodes = () =>
    request("/nodes")
      .then((data) => setNodes(asArray(data).filter((node) => node.isActive !== false)))
      .catch(() => setNodes([]));

  useEffect(() => {
    load();
    loadNodes();
  }, []);

  useEffect(() => {
    if (!form.nodeId || !form.bookingDate) {
      setSlots([]);
      setSlotMessage("Select a grid node and date to view slots.");
      return;
    }
    loadSlots(form.nodeId, form.bookingDate, form.slotId);
  }, [form.nodeId, form.bookingDate]);

  async function loadSlots(nodeId = form.nodeId, bookingDate = form.bookingDate) {
    if (!nodeId.trim() || !bookingDate) return;
    setSlotMessage("Loading slots for selected date...");
    try {
      const data = await request(
        `/reservations/nodes/${encodeURIComponent(nodeId.trim())}/available-slots?date=${bookingDate}`,
      );
      const nextSlots = asArray(data);
      setSlots(nextSlots);
      const firstAvailable = nextSlots.find((slot) => slotAvailable(slot));
      setForm((current) => {
        const selected = nextSlots.find((slot) => slot.slotId === current.slotId);
        const keepSelected = selected && canSelectSlot(selected, current);
        return {
          ...current,
          slotId: keepSelected ? current.slotId : firstAvailable?.slotId || "",
        };
      });
      const availableCount = nextSlots.filter((slot) => slotAvailable(slot)).length;
      setSlotMessage(
        nextSlots.length
          ? `${availableCount} available slot${availableCount === 1 ? "" : "s"}. Booked slots are shown but cannot be selected.`
          : "No schedule slots for this node on the selected date.",
      );
    } catch (err) {
      setSlots([]);
      setSlotMessage(err.message);
    }
  }

  async function save(e) {
    e.preventDefault();
    const selectedSlot = slots.find((slot) => slot.slotId === form.slotId);
    if (!selectedSlot) {
      setMessage("Select a date and time slot first.");
      return;
    }
    if (!canSelectSlot(selectedSlot, form)) {
      setMessage("That slot is already booked. Select an available slot.");
      return;
    }

    const basePayload = {
      prosumerNic: form.prosumerNic.trim(),
      nodeId: form.nodeId.trim(),
      energyKwh: Number(form.energyKwh),
    };
    const requestPayload = form.id
      ? {
          ...basePayload,
          slotStartUtc: selectedSlot.startUtc,
          slotEndUtc: selectedSlot.endUtc,
          status: form.status,
        }
      : {
          ...basePayload,
          slotId: form.slotId,
        };
    const result = await request(
      form.id ? `/reservations/${form.id}` : "/reservations/from-slot",
      {
        method: form.id ? "PUT" : "POST",
        body: JSON.stringify(requestPayload),
      },
    );
    setMessage(result.message || "");
    if (result.success) {
      setForm(createDefaultReservationForm());
      setSlots([]);
    }
    load();
  }

  async function cancelReservation(id) {
    const result = await request(`/reservations/${id}/cancel`, {
      method: "POST",
    });
    setMessage(result.message || "Cancel request completed.");
    load();
  }

  async function approveReservation(id) {
    const result = await request(`/reservations/${id}/approve`, {
      method: "POST",
    });
    setMessage(result.message || "Reservation approved.");
    load();
  }

  function editReservation(reservation) {
    const next = reservationToForm(reservation);
    setForm(next);
    setMessage("Editing reservation. Pick a date and available slot; updates require at least 12 hours notice.");
  }

  function resetForm() {
    setForm(createDefaultReservationForm());
    setSlots([]);
    setMessage("");
  }

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, query],
  );

  return (
    <PagePanel
      message={message}
      title="Energy Booking Workflow"
      subtitle="Create, update, cancel, search, and finalize QR-verified transfers."
      icon={<BatteryCharging size={19} />}
    >
      <div className="flex justify-between gap-3">
        <div className="flex w-full max-w-md items-center gap-2">
          <Search className="shrink-0 text-emerald-700" size={18} />
          <input
            placeholder="Search NIC, node, status, or QR code"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <Form
        onSubmit={save}
        submit={form.id ? "Update Reservation" : "Save Reservation"}
      >
        <Field label="Prosumer NIC">
          <input
            value={form.prosumerNic}
            onChange={(e) => setForm({ ...form, prosumerNic: e.target.value })}
          />
        </Field>
        <Field label="Grid Node">
          {nodes.length > 0 ? (
            <select
              value={form.nodeId}
              onChange={(e) => setForm({ ...form, nodeId: e.target.value, slotId: "" })}
            >
              <option value="">Select active grid node</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name || "Grid node"} - {node.locationName || "Location not set"}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={form.nodeId}
              placeholder="Node ID"
              onChange={(e) => setForm({ ...form, nodeId: e.target.value, slotId: "" })}
            />
          )}
        </Field>
        <Field label="Booking Date">
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={form.bookingDate}
            onChange={(e) => setForm({ ...form, bookingDate: e.target.value, slotId: "" })}
          />
        </Field>
        <div className="grid gap-1.5 text-xs font-semibold text-slate-500 md:col-span-2">
          <span>Time Slot</span>
          <div className="grid gap-2 rounded-md border border-[#dbe5df] bg-white p-3">
            <div className="flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
              <select
                value={form.slotId || ""}
                onChange={(e) => setForm({ ...form, slotId: e.target.value })}
                disabled={!slots.length}
              >
                <option value="">Select a slot</option>
                {slots.map((slot) => (
                  <option
                    key={slot.slotId}
                    value={slot.slotId}
                    disabled={!canSelectSlot(slot, form)}
                  >
                    {slotLabel(slot, form)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#00483d] bg-white px-3.5 text-sm font-semibold text-[#00483d]"
                onClick={() => loadSlots()}
              >
                Refresh slots
              </button>
            </div>
            <span className="text-xs font-semibold text-[#66736e]">{slotMessage}</span>
          </div>
        </div>
        <Field label="Energy kWh">
          <input
            type="number"
            value={form.energyKwh}
            onChange={(e) =>
              setForm({ ...form, energyKwh: Number(e.target.value) })
            }
          />
        </Field>
        {form.id && (
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Pending</option>
              <option>Approved</option>
              <option>Cancelled</option>
              <option>Completed</option>
            </select>
          </Field>
        )}
        {form.id && (
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-100 px-4 font-semibold text-slate-700"
            onClick={resetForm}
          >
            <RotateCcw size={17} />
            New Reservation
          </button>
        )}
      </Form>
      <form
        className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50 p-3.5 max-sm:flex-col max-sm:items-stretch"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await request("/reservations/complete-by-qr", {
            method: "POST",
            body: JSON.stringify({ transactionCode: qr }),
          });
          setMessage(result.message || "Transfer finalized");
          if (result.success) setQr("");
          load();
        }}
      >
        <QrCode className="shrink-0 text-emerald-700" size={22} />
        <input
          placeholder="Paste scanned QR transaction code"
          value={qr}
          onChange={(e) => setQr(e.target.value)}
        />
        <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800">
          <ScanLine size={17} />
          Finalize Transfer
        </button>
      </form>
      <DataTable
        rows={filtered}
        columns={[
          ["prosumerNic", "Prosumer"],
          ["nodeId", "Node"],
          ["slotStartUtc", "Slot Start", formatDate],
          ["energyKwh", "kWh"],
          ["status", "Status", (v) => <Badge value={v} />],
          ["transactionCode", "QR Transaction"],
          [
            "actions",
            "Actions",
            (_, r) => (
              <div className="flex min-w-52 flex-wrap gap-1.5">
                <button
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-700"
                  onClick={() => editReservation(r)}
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-50 px-2.5 text-xs font-semibold text-red-700"
                  onClick={() => cancelReservation(r.id)}
                >
                  <Ban size={15} />
                  Cancel
                </button>
                {canApprove && (r.status === "Pending" || r.status === 0) && (
                  <button
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700"
                    onClick={() => approveReservation(r.id)}
                  >
                    <CheckCircle2 size={15} />
                    Approve
                  </button>
                )}
              </div>
            ),
          ],
        ]}
      />
    </PagePanel>
  );
}
