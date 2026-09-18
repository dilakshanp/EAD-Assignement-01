import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Login } from "./components/Login.jsx";
import { Shell } from "./components/Shell.jsx";
import "./styles.css";

function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");

  if (!user) return <Login onLogin={(nextUser) => {
    localStorage.setItem("smartSolarRole", String(nextUser.role));
    setUser(nextUser);
  }} />;

  return (
    <Shell
      user={user}
      tab={tab}
      setTab={setTab}
      onLogout={() => {
        localStorage.removeItem("smartSolarRole");
        setUser(null);
        setTab("dashboard");
      }}
    />
  );
}

createRoot(document.getElementById("root")).render(<App />);
