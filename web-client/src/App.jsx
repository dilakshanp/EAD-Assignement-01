import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BatteryCharging, CheckCircle, MapPin, QrCode, Search, Sun, Users } from "lucide-react";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5088/api";

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`API request failed: ${res.status}`);
  return res.json();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const emptyNode = { name: "", locationName: "", latitude: 6.9271, longitude: 79.8612, capacityKwh: 100, batteryStorageSlots: 4, isActive: true, schedules: [] };
const emptyProsumer = { nic: "", fullName: "", phone: "", email: "", address: "", solarCapacityKw: 5, status: "Active" };

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  if (!user) return <Login onLogin={setUser} error={error} setError={setError} />;
  return <Shell user={user} onLogout={() => setUser(null)} />;
}

function Login({ onLogin, error, setError }) {
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  async function submit(e) {
    e.preventDefault();
    const result = await request("/auth/login", { method: "POST", body: JSON.stringify(form) });
    if (result.success) onLogin(result.data);
    else setError(result.message || "Login failed");
  }
  return (
    <main className="login">
      <section className="loginPanel">
        <Sun size={42} />
        <h1>Smart Solar Microgrid</h1>
        <form onSubmit={submit}>
          <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="error">{error}</p>}
          <button>Sign in</button>
        </form>
      </section>
    </main>
  );
}

function Shell({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const isBackoffice = user.role === "Backoffice" || user.role === 0;
  return (
    <main>
      <header className="topbar">
        <strong><Sun size={22} /> Smart Solar Microgrid</strong>
        <nav>
          <button className={tab === "dashboard" ? "active" : ""} onClick={() => setTab("dashboard")}>Dashboard</button>
          {isBackoffice && <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>Users</button>}
          <button className={tab === "prosumers" ? "active" : ""} onClick={() => setTab("prosumers")}>Prosumers</button>
          <button className={tab === "nodes" ? "active" : ""} onClick={() => setTab("nodes")}>Nodes</button>
          <button className={tab === "reservations" ? "active" : ""} onClick={() => setTab("reservations")}>Reservations</button>
          <button onClick={onLogout}>Logout</button>
        </nav>
      </header>
      {tab === "dashboard" && <Dashboard />}
      {tab === "users" && <UsersPanel />}
      {tab === "prosumers" && <Prosumers />}
      {tab === "nodes" && <Nodes />}
      {tab === "reservations" && <Reservations />}
    </main>
  );
}

function Dashboard() {
  const [reservations, setReservations] = useState([]);
  const [nodes, setNodes] = useState([]);
  useEffect(() => {
    request("/reservations").then((data) => setReservations(asArray(data))).catch(() => setReservations([]));
    request("/nodes").then((data) => setNodes(asArray(data))).catch(() => setNodes([]));
  }, []);
  const approved = reservations.filter((x) => x.status === "Approved" || x.status === 1).length;
  const pending = reservations.filter((x) => x.status === "Pending" || x.status === 0).length;
  return <section className="grid">
    <Metric icon={<BatteryCharging />} label="Approved Future Reservations" value={approved} />
    <Metric icon={<CheckCircle />} label="Pending Reservations" value={pending} />
    <Metric icon={<MapPin />} label="Active Grid Nodes" value={nodes.filter((x) => x.isActive).length} />
    <Metric icon={<Users />} label="Total Bookings" value={reservations.length} />
  </section>;
}

function Metric({ icon, label, value }) {
  return <article className="metric">{icon}<span>{label}</span><strong>{value}</strong></article>;
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "Backoffice", prosumerNic: "" });
  const [message, setMessage] = useState("");
  const load = () => request("/auth/users").then((data) => setUsers(asArray(data))).catch((err) => setMessage(err.message));
  useEffect(() => {
    load();
  }, []);
  async function create(e) {
    e.preventDefault();
    await request("/auth/users", { method: "POST", body: JSON.stringify(form) });
    setForm({ username: "", password: "", role: "Backoffice", prosumerNic: "" });
    load();
  }
  return <section className="panel"><h2>User Management</h2>{message && <p className="error">{message}</p>}<Form onSubmit={create}>
    <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
    <input placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Backoffice</option><option>GridOperator</option></select>
    <button>Create</button>
  </Form><Table rows={users} columns={["username", "role", "status"]} /></section>;
}

function Prosumers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyProsumer);
  const [message, setMessage] = useState("");
  const load = () => request("/prosumers").then((data) => setRows(asArray(data))).catch((err) => setMessage(err.message));
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    await request(`/prosumers/${form.nic}`, { method: "PUT", body: JSON.stringify(form) });
    setForm(emptyProsumer);
    load();
  }
  async function status(nic, action) {
    await request(`/prosumers/${nic}/${action}`, { method: "POST" });
    load();
  }
  return <section className="panel"><h2>Prosumer Management</h2>{message && <p className="error">{message}</p>}<Form onSubmit={save}>
    {["nic", "fullName", "phone", "email", "address"].map((k) => <input key={k} placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />)}
    <input type="number" placeholder="Solar kW" value={form.solarCapacityKw} onChange={(e) => setForm({ ...form, solarCapacityKw: Number(e.target.value) })} />
    <button>Save</button>
  </Form><div className="cards">{rows.map((p) => <article className="card" key={p.nic}><b>{p.fullName}</b><span>{p.nic} · {p.status}</span><span>{p.email}</span><button onClick={() => setForm(p)}>Edit</button><button onClick={() => status(p.nic, "activate")}>Activate</button><button onClick={() => status(p.nic, "deactivate")}>Deactivate</button></article>)}</div></section>;
}

function Nodes() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyNode);
  const [message, setMessage] = useState("");
  const load = () => request("/nodes").then((data) => {
    setRows(asArray(data));
    setMessage("");
  }).catch((err) => {
    setRows([]);
    setMessage(err.message);
  });
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    await request(form.id ? `/nodes/${form.id}` : "/nodes", { method: form.id ? "PUT" : "POST", body: JSON.stringify(form) });
    setForm(emptyNode);
    load();
  }
  return <section className="panel"><h2>Microgrid Nodes</h2>{message && <p className="error">{message}</p>}<Form onSubmit={save}>
    {["name", "locationName"].map((k) => <input key={k} placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />)}
    {["latitude", "longitude", "capacityKwh", "batteryStorageSlots"].map((k) => <input key={k} type="number" placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) })} />)}
    <button>Save</button>
  </Form><div className="cards">{rows.map((n) => <article className="card" key={n.id}><b>{n.name}</b><span>{n.locationName}</span><span>{n.capacityKwh} kWh · {n.batteryStorageSlots} slots</span><button onClick={() => setForm(n)}>Edit</button><button onClick={() => request(`/nodes/${n.id}/deactivate`, { method: "POST" }).then(load)}>Deactivate</button></article>)}</div></section>;
}

function Reservations() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [qr, setQr] = useState("");
  const [form, setForm] = useState({ prosumerNic: "", nodeId: "", slotStartUtc: "", slotEndUtc: "", energyKwh: 5, status: "Approved" });
  const [message, setMessage] = useState("");
  const load = () => request("/reservations").then((data) => {
    setRows(asArray(data));
    setMessage("");
  }).catch((err) => {
    setRows([]);
    setMessage(err.message);
  });
  useEffect(() => {
    load();
  }, []);
  async function save(e) {
    e.preventDefault();
    await request(form.id ? `/reservations/${form.id}` : "/reservations", { method: form.id ? "PUT" : "POST", body: JSON.stringify(form) });
    load();
  }
  const filtered = useMemo(() => rows.filter((r) => JSON.stringify(r).toLowerCase().includes(query.toLowerCase())), [rows, query]);
  return <section className="panel"><h2>Reservations</h2>{message && <p className="error">{message}</p>}<div className="search"><Search size={18} /><input placeholder="Search bookings" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
    <Form onSubmit={save}>
      {["prosumerNic", "nodeId"].map((k) => <input key={k} placeholder={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />)}
      <input type="datetime-local" onChange={(e) => setForm({ ...form, slotStartUtc: new Date(e.target.value).toISOString() })} />
      <input type="datetime-local" onChange={(e) => setForm({ ...form, slotEndUtc: new Date(e.target.value).toISOString() })} />
      <input type="number" value={form.energyKwh} onChange={(e) => setForm({ ...form, energyKwh: Number(e.target.value) })} />
      <button>Save</button>
    </Form>
    <Form onSubmit={async (e) => { e.preventDefault(); await request("/reservations/complete-by-qr", { method: "POST", body: JSON.stringify({ transactionCode: qr }) }); setQr(""); load(); }}>
      <QrCode /><input placeholder="Paste scanned QR transaction code" value={qr} onChange={(e) => setQr(e.target.value)} /><button>Finalize</button>
    </Form>
    <Table rows={filtered} columns={["prosumerNic", "nodeId", "slotStartUtc", "energyKwh", "status", "transactionCode"]} />
  </section>;
}

function Form({ children, onSubmit }) { return <form className="form" onSubmit={onSubmit}>{children}</form>; }
function Table({ rows, columns }) { return <div className="table"><table><thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={row.id || row.nic || i}>{columns.map((c) => <td key={c}>{String(row[c] ?? "")}</td>)}</tr>)}</tbody></table></div>; }

createRoot(document.getElementById("root")).render(<App />);
