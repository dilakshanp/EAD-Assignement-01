export const API = import.meta.env.VITE_API_URL || "http://localhost:5088/api";

export async function request(path, options = {}) {
  const token = localStorage.getItem("smartSolarToken");
  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
