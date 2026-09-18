export const API = import.meta.env.VITE_API_URL || "http://localhost:5088/api";

export async function request(path, options = {}) {
  const role = localStorage.getItem("smartSolarRole");
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(role ? { "X-User-Role": role } : {}), ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
