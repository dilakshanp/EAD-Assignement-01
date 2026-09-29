import React, { useEffect, useState } from "react";
import { Pencil, PowerOff, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Field } from "../components/Field.jsx";
import { Form } from "../components/Form.jsx";
import { PagePanel } from "../components/PagePanel.jsx";
import { asArray, request } from "../lib/api.js";

const emptyUserForm = { id: "", username: "", password: "", role: "Backoffice", prosumerNic: "" };

function accountStatus(value) {
  if (value === 0 || value === "Active") return "Active";
  if (value === 1 || value === "PendingDeactivation") return "PendingDeactivation";
  if (value === 2 || value === "Deactivated") return "Deactivated";
  return String(value || "Unknown");
}

export function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUserForm);
  const [message, setMessage] = useState("");
  const isEditing = Boolean(form.id);
  const load = () => request("/auth/users").then((data) => setUsers(asArray(data))).catch((err) => setMessage(err.message));

  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    try {
      const payload = {
        username: form.username,
        password: form.password,
        role: form.role,
        prosumerNic: form.prosumerNic || null,
      };
      const result = await request(isEditing ? `/auth/users/${form.id}` : "/auth/users", {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setMessage(result.message || (isEditing ? "User updated." : "User created."));
      setForm(emptyUserForm);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  function editUser(user) {
    setForm({
      id: user.id || "",
      username: user.username || "",
      password: "",
      role: String(user.role || "Backoffice"),
      prosumerNic: user.prosumerNic || "",
    });
    setMessage("Editing user. Leave password blank to keep the current password.");
  }

  async function toggleUser(user) {
    const active = accountStatus(user.status) === "Active";
    try {
      const result = await request(`/auth/users/${user.id}/${active ? "deactivate" : "activate"}`, { method: "POST" });
      setMessage(result.message || (active ? "User deactivated." : "User activated."));
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Delete user ${user.username}?`)) return;
    try {
      const result = await request(`/auth/users/${user.id}`, { method: "DELETE" });
      setMessage(result.message || "User deleted.");
      if (form.id === user.id) setForm(emptyUserForm);
      load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <PagePanel message={message} title="Manage Role-Based Users" subtitle="Backoffice creates, edits, disables, reactivates, and removes web users." icon={<ShieldCheck size={19} />}>
      <Form onSubmit={save} submit={isEditing ? "Update User" : "Create User"}>
        <Field label="Username"><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
        <Field label={isEditing ? "Password (optional)" : "Password"}><input type="password" value={form.password} placeholder={isEditing ? "Leave blank to keep current" : "Minimum 8 characters"} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Role"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Backoffice</option><option>GridOperator</option></select></Field>
        {isEditing && <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-100 px-4 font-semibold text-slate-700 hover:bg-slate-200" onClick={() => setForm(emptyUserForm)}>Cancel Edit</button>}
      </Form>
      <DataTable rows={users} columns={[
        ["username", "Username"],
        ["role", "Role"],
        ["status", "Status", (v) => <Badge value={v} />],
        ["actions", "Actions", (_, user) => <UserActions user={user} onEdit={() => editUser(user)} onToggle={() => toggleUser(user)} onDelete={() => deleteUser(user)} />],
      ]} />
    </PagePanel>
  );
}

function UserActions({ user, onEdit, onToggle, onDelete }) {
  const active = accountStatus(user.status) === "Active";
  return (
    <div className="flex min-w-56 flex-wrap gap-1.5">
      <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-slate-100 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-200" onClick={onEdit}><Pencil size={15} />Edit</button>
      <button type="button" className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold ${active ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`} onClick={onToggle}>
        {active ? <PowerOff size={15} /> : <RotateCcw size={15} />}
        {active ? "Deactivate" : "Activate"}
      </button>
      <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-red-50 px-2.5 text-xs font-semibold text-red-700 hover:bg-red-100" onClick={onDelete}><Trash2 size={15} />Delete</button>
    </div>
  );
}
