export const API = import.meta.env.VITE_API_URL || "http://localhost:5088/api";

async function readResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

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
  const payload = await readResponse(response);
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null
      ? payload.message || payload.title
      : payload;
    throw new Error(message || `API request failed: ${response.status}`);
  }
  return payload;
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}
