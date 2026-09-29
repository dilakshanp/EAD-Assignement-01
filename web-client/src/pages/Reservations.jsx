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

function toDateTimeLocal(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoOrEmpty(value) {
  return value ? new Date(value).toISOString() : "";
}

function createDefaultReservationForm() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setMinutes(0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    id: "",
    prosumerNic: "",
    nodeId: "",
    slotStartLocal: toDateTimeLocal(start),
    slotEndLocal: toDateTimeLocal(end),
    energyKwh: 5,
    status: "Approved",
  };
}

function reservationToForm(reservation) {
  return {
    id: reservation.id || "",
    prosumerNic: reservation.prosumerNic || "",
    nodeId: reservation.nodeId || "",
    slotStartLocal: reservation.slotStartUtc
      ? toDateTimeLocal(new Date(reservation.slotStartUtc))
      : createDefaultReservationForm().slotStartLocal,
    slotEndLocal: reservation.slotEndUtc
      ? toDateTimeLocal(new Date(reservation.slotEndUtc))
      : createDefaultReservationForm().slotEndLocal,
    energyKwh: reservation.energyKwh || 5,
    status: reservation.status || "Approved",
  };
}

export function Reservations() {
  const role = localStorage.getItem("smartSolarRole");
  const canApprove =
    role === "Backoffice" ||
    role === "GridOperator" ||
    role === "0" ||
    role === "1";
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(createDefaultReservationForm());
  const minDate = toDateTimeLocal(new Date());
  const maxDate = toDateTimeLocal(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );
  const load = () =>
    request("/reservations")
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
    const payload = {
      prosumerNic: form.prosumerNic.trim(),
      nodeId: form.nodeId.trim(),
      slotStartUtc: toIsoOrEmpty(form.slotStartLocal),
      slotEndUtc: toIsoOrEmpty(form.slotEndLocal),
      energyKwh: Number(form.energyKwh),
      status: form.status,
    };
    const result = await request(
      form.id ? `/reservations/${form.id}` : "/reservations",
      { method: form.id ? "PUT" : "POST", body: JSON.stringify(payload) },
    );
    setMessage(result.message || "");
    if (result.success) setForm(createDefaultReservationForm());
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
    setForm(reservationToForm(reservation));
    setMessage(
      "Editing reservation. Updates require at least 12 hours notice.",
    );
  }

  function resetForm() {
    setForm(createDefaultReservationForm());
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
        <Field label="Node ID">
          <input
            value={form.nodeId}
            onChange={(e) => setForm({ ...form, nodeId: e.target.value })}
          />
        </Field>
        <Field label="Start">
          <input
            type="datetime-local"
            min={minDate}
            max={maxDate}
            value={form.slotStartLocal}
            onChange={(e) =>
              setForm({ ...form, slotStartLocal: e.target.value })
            }
          />
        </Field>
        <Field label="End">
          <input
            type="datetime-local"
            min={minDate}
            max={maxDate}
            value={form.slotEndLocal}
            onChange={(e) => setForm({ ...form, slotEndLocal: e.target.value })}
          />
        </Field>
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
