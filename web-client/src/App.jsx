import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Login } from "./components/Login.jsx";
import { Shell } from "./components/Shell.jsx";
import "./styles.css";

function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");

  if (!user)
    return (
      <Login
        onLogin={(session) => {
          localStorage.setItem("smartSolarToken", session.token);
          localStorage.setItem("smartSolarRole", String(session.user.role));
          setUser(session.user);
        }}
      />
    );

  return (
    <Shell
      user={user}
      tab={tab}
      setTab={setTab}
      onLogout={() => {
        localStorage.removeItem("smartSolarToken");
        localStorage.removeItem("smartSolarRole");
        setUser(null);
        setTab("dashboard");
      }}
    />
  );
}

createRoot(document.getElementById("root")).render(<App />);
