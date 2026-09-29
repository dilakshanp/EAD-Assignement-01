import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Filter,
  Pencil,
  RotateCcw,
  Save,
  Search,
  UserX,
  Users,
  X,
} from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Field } from "../components/Field.jsx";
import { PagePanel } from "../components/PagePanel.jsx";
import { asArray, request } from "../lib/api.js";
import { emptyProsumer } from "../lib/defaults.js";

function accountStatus(value) {
  if (value === 0 || value === "Active") return "Active";
  if (value === 1 || value === "PendingDeactivation")
    return "PendingDeactivation";
  if (value === 2 || value === "Deactivated") return "Deactivated";
  return String(value || "Unknown");
}

function statusMatches(prosumer, status) {
  return accountStatus(prosumer.status) === status;
}

function ActionButton({ children, icon, tone = "neutral", onClick }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger: "bg-red-50 text-red-700 hover:bg-red-100",
    warning: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  };
  return (
    <button
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${tones[tone]}`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}

function FilterButton({ active, children, tone = "slate", onClick }) {
  const activeTone = {
    slate: "bg-slate-900 text-white",
    amber: "bg-amber-600 text-white",
    emerald: "bg-emerald-700 text-white",
    red: "bg-red-700 text-white",
  }[tone];
  return (
    <button
      className={`rounded-md px-3 py-2 text-sm font-semibold ${active ? activeTone : "bg-white text-slate-700 hover:bg-slate-100"}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function Prosumers() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyProsumer);
  const [editingNic, setEditingNic] = useState("");
  const [message, setMessage] = useState("");
  const isEditing = Boolean(editingNic);
  const load = () =>
    request("/prosumers")
      .then((data) => setRows(asArray(data)))
      .catch((err) => setMessage(err.message));

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyProsumer);
    setEditingNic("");
  }

  function editProsumer(prosumer) {
    setForm({ ...emptyProsumer, ...prosumer });
    setEditingNic(prosumer.nic || "");
    setMessage(
      "Editing prosumer profile. NIC is locked because it is the primary key.",
    );
  }

  async function save(e) {
    e.preventDefault();
    try {
      const nic = isEditing ? editingNic : form.nic;
      const payload = { ...form, nic };
      const result = await request(`/prosumers/${nic}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMessage(
        result.message || (isEditing ? "Prosumer updated." : "Prosumer saved."),
      );
      resetForm();
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function status(nic, action) {
    try {
      const result = await request(`/prosumers/${nic}/${action}`, {
        method: "POST",
      });
      setMessage(result.message || "Prosumer status updated.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  const counts = useMemo(
    () => ({
      all: rows.length,
      pending: rows.filter((p) => statusMatches(p, "PendingDeactivation"))
        .length,
      active: rows.filter((p) => statusMatches(p, "Active")).length,
      deactivated: rows.filter((p) => statusMatches(p, "Deactivated")).length,
    }),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((prosumer) => {
      const status = accountStatus(prosumer.status);
      const matchesFilter =
        filter === "all" ||
        (filter === "pending" && status === "PendingDeactivation") ||
        (filter === "active" && status === "Active") ||
        (filter === "deactivated" && status === "Deactivated");
      if (!matchesFilter) return false;
      if (!query) return true;
      return [
        prosumer.nic,
        prosumer.fullName,
        prosumer.email,
        prosumer.phone,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [rows, filter, search]);

  return (
    <PagePanel
      message={message}
      title="Prosumer Management"
      subtitle="Create profiles, maintain account status, and review deactivation requests."
      icon={<Users size={19} />}
    >
      <form
        className="grid gap-4 rounded-md border border-[#dbe5df] bg-[#f7faf7] p-5"
        onSubmit={save}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#102a2b]">
              {isEditing ? "Edit registered prosumer" : "Register new prosumer"}
            </h3>
            <p className="mt-1 text-sm text-[#657778]">
              NIC is the primary account key used for booking and verification.
            </p>
          </div>
          {isEditing && <Badge value={`Editing ${editingNic}`} />}
        </div>

        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="NIC">
            <input
              disabled={isEditing}
              value={form.nic}
              onChange={(e) => setForm({ ...form, nic: e.target.value })}
            />
          </Field>
          <Field label="Full Name">
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Address">
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Solar Capacity kW">
            <input
              min="0"
              type="number"
              value={form.solarCapacityKw}
              onChange={(e) =>
                setForm({ ...form, solarCapacityKw: Number(e.target.value) })
              }
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dbe5df] pt-4">
          <p className="text-sm font-semibold text-slate-500">
            {isEditing
              ? "Update the profile details, or cancel to return to create mode."
              : "Save creates or updates a prosumer profile under the entered NIC."}
          </p>
          <div className="flex flex-wrap gap-2">
            {isEditing && (
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-100 px-4 font-semibold text-slate-700 hover:bg-slate-200"
                onClick={resetForm}
              >
                <X size={17} />
                Cancel Edit
              </button>
            )}
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#00483d] px-5 font-semibold text-white hover:bg-[#00372f]">
              <Save size={17} />
              {isEditing ? "Update Prosumer" : "Save Prosumer"}
            </button>
          </div>
        </div>
      </form>

      <section className="grid gap-4 rounded-md border border-[#dbe5df] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#102a2b]">Accounts</h3>
            <p className="mt-1 text-sm text-[#657778]">
              Search and filter the list before choosing row actions.
            </p>
          </div>
          <Badge value={`${filteredRows.length} shown`} />
        </div>

        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 xl:grid-cols-[minmax(260px,1fr)_auto] xl:items-center">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="min-h-11 w-full rounded-md border border-[#dbe5df] bg-white py-2 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#00483d] focus:ring-4 focus:ring-emerald-50"
              placeholder="Search NIC, name, email, or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
              <Filter size={16} />
              Filter
            </span>
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All ({counts.all})
            </FilterButton>
            <FilterButton
              active={filter === "pending"}
              tone="amber"
              onClick={() => setFilter("pending")}
            >
              Pending ({counts.pending})
            </FilterButton>
            <FilterButton
              active={filter === "active"}
              tone="emerald"
              onClick={() => setFilter("active")}
            >
              Active ({counts.active})
            </FilterButton>
            <FilterButton
              active={filter === "deactivated"}
              tone="red"
              onClick={() => setFilter("deactivated")}
            >
              Deactivated ({counts.deactivated})
            </FilterButton>
          </div>
        </div>

        <DataTable
          rows={filteredRows}
          columns={[
            ["nic", "NIC"],
            ["fullName", "Name"],
            ["email", "Email"],
            ["solarCapacityKw", "Solar kW"],
            ["status", "Status", (v) => <Badge value={v} />],
            [
              "actions",
              "Actions",
              (_, p) => (
                <ProsumerActions
                  prosumer={p}
                  onEdit={() => editProsumer(p)}
                  onStatus={status}
                />
              ),
            ],
          ]}
        />
      </section>
    </PagePanel>
  );
}

function ProsumerActions({ prosumer, onEdit, onStatus }) {
  const current = accountStatus(prosumer.status);
  return (
    <div className="flex min-w-44 flex-wrap gap-1.5">
      <ActionButton icon={<Pencil size={15} />} onClick={onEdit}>
        Edit
      </ActionButton>
      {current === "Active" && (
        <ActionButton
          tone="danger"
          icon={<UserX size={15} />}
          onClick={() => onStatus(prosumer.nic, "deactivate")}
        >
          Deactivate
        </ActionButton>
      )}
      {current === "Deactivated" && (
        <ActionButton
          tone="success"
          icon={<RotateCcw size={15} />}
          onClick={() => onStatus(prosumer.nic, "activate")}
        >
          Reactivate
        </ActionButton>
      )}
      {current === "PendingDeactivation" && (
        <>
          <ActionButton
            tone="warning"
            icon={<CheckCircle2 size={15} />}
            onClick={() => onStatus(prosumer.nic, "deactivate")}
          >
            Approve Request
          </ActionButton>
          <ActionButton
            tone="success"
            icon={<RotateCcw size={15} />}
            onClick={() => onStatus(prosumer.nic, "activate")}
          >
            Keep Active
          </ActionButton>
        </>
      )}
    </div>
  );
}
