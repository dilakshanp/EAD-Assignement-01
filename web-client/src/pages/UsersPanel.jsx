import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { Field } from "../components/Field.jsx";
import { Form } from "../components/Form.jsx";
import { PagePanel } from "../components/PagePanel.jsx";
import { asArray, request } from "../lib/api.js";

export function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "Backoffice", prosumerNic: "" });
  const [message, setMessage] = useState("");
  const load = () => request("/auth/users").then((data) => setUsers(asArray(data))).catch((err) => setMessage(err.message));

  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    await request("/auth/users", { method: "POST", body: JSON.stringify(form) });
    setForm({ username: "", password: "", role: "Backoffice", prosumerNic: "" });
    load();
  }

  return (
    <PagePanel message={message} title="Create Role-Based Users" subtitle="Backoffice manages administration; operators manage field verification." icon={<ShieldCheck size={19} />}>
      <Form onSubmit={create} submit="Create User">
        <Field label="Username"><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
        <Field label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Role"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Backoffice</option><option>GridOperator</option></select></Field>
      </Form>
      <DataTable rows={users} columns={[["username", "Username"], ["role", "Role"], ["status", "Status", (v) => <Badge value={v} />]]} />
    </PagePanel>
  );
}
