import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Login } from "./components/Login.jsx";
import { Shell } from "./components/Shell.jsx";
import "./styles.css";

const TOKEN_KEY = "smartSolarToken";
const ROLE_KEY = "smartSolarRole";
const USER_KEY = "smartSolarUser";

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
}

function decodeUserFromToken(token) {
  try {
    const [payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    const data = JSON.parse(atob(padded));
    if (data.ExpiresAt && data.ExpiresAt * 1000 < Date.now()) return null;
    if (!data.Username || !data.Role) return null;
    return {
      username: data.Username,
      role: data.Role,
      prosumerNic: data.ProsumerNic || "",
    };
  } catch {
    return null;
  }
}

function readStoredUser() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.username && user?.role) return user;
    }

    const tokenUser = decodeUserFromToken(token);
    if (tokenUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(tokenUser));
      localStorage.setItem(ROLE_KEY, String(tokenUser.role));
      return tokenUser;
    }
  } catch {
    clearSession();
  }

  return null;
}

function saveSession(session) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(ROLE_KEY, String(session.user.role));
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

function App() {
  const [user, setUser] = useState(readStoredUser);
  const [tab, setTab] = useState("dashboard");

  if (!user)
    return (
      <Login
        onLogin={(session) => {
          saveSession(session);
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
        clearSession();
        setUser(null);
        setTab("dashboard");
      }}
    />
  );
}

createRoot(document.getElementById("root")).render(<App />);
