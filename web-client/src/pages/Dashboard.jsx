import React, { useEffect, useState } from "react";
import {
  Activity,
  BatteryCharging,
  CheckCircle2,
  MapPin,
  Zap,
} from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Metric } from "../components/Metric.jsx";
import { asArray, request } from "../lib/api.js";
import { formatDate } from "../lib/format.js";

export function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    request("/reservations")
      .then((data) => setReservations(asArray(data)))
      .catch(() => setReservations([]));
    request("/nodes")
      .then((data) => setNodes(asArray(data)))
      .catch(() => setNodes([]));
  }, []);

  const approved = reservations.filter(
    (x) => x.status === "Approved" || x.status === 1,
  ).length;
  const pending = reservations.filter(
    (x) => x.status === "Pending" || x.status === 0,
  ).length;
  const completed = reservations.filter(
    (x) => x.status === "Completed" || x.status === 3,
  ).length;

  return (
    <div className="grid gap-6 p-4 md:p-8 md:pt-2">
      <section className="relative flex min-h-33 items-end justify-between gap-5 overflow-hidden rounded-md bg-[#00483d] p-7 text-white max-sm:flex-col max-sm:items-start">
        <div>
          <p className="eyebrow !text-[#d9ff3f]">Live operations</p>
          <h2 className="relative mt-2 text-4xl font-bold tracking-tight">
            Microgrid trading overview
          </h2>
          <p className="relative mt-2 max-w-lg text-sm text-teal-50/70">
            A real-time pulse of your stations, reservations, and completed
            energy transfers.
          </p>
        </div>
        <div className="relative grid min-w-40 gap-1 text-right max-sm:text-left">
          <span className="text-sm font-semibold text-teal-50/70">
            Total bookings
          </span>
          <strong className="text-5xl leading-none text-[#d9ff3f]">
            {reservations.length}
          </strong>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<BatteryCharging />}
          label="Approved Future Reservations"
          value={approved}
          tone="green"
        />
        <Metric
          icon={<Activity />}
          label="Pending Reservations"
          value={pending}
          tone="amber"
        />
        <Metric
          icon={<MapPin />}
          label="Active Grid Nodes"
          value={nodes.filter((x) => x.isActive).length}
          tone="blue"
        />
        <Metric
          icon={<CheckCircle2 />}
          label="Completed Transfers"
          value={completed}
          tone="violet"
        />
      </section>
      <section className="surface grid gap-4 rounded-md p-5 md:p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
            <Zap size={19} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent Reservations
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Latest trading slots coming from the central API.
            </p>
          </div>
        </div>
        <DataTable
          rows={reservations.slice(0, 6)}
          columns={[
            ["prosumerNic", "Prosumer NIC"],
            ["nodeId", "Node"],
            ["slotStartUtc", "Slot Start", formatDate],
            ["energyKwh", "Energy kWh"],
            ["status", "Status", (v) => <Badge value={v} />],
          ]}
        />
      </section>
    </div>
  );
}
