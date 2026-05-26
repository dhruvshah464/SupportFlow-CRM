const BASE = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("crm_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { headers, ...options });

  if (res.status === 401) {
    localStorage.removeItem("crm_token");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  signup: (data) =>
    request("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),

  login: (data) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),

  getMe: () => request("/api/auth/me"),

  // Tickets
  getStats: () => request("/api/stats"),

  listTickets: ({ status, priority, search } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (search) params.set("search", search);
    const qs = params.toString();
    return request(`/api/tickets${qs ? `?${qs}` : ""}`);
  },

  getTicket: (ticketId) => request(`/api/tickets/${ticketId}`),

  createTicket: (data) =>
    request("/api/tickets", { method: "POST", body: JSON.stringify(data) }),

  updateTicket: (ticketId, data) =>
    request(`/api/tickets/${ticketId}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteTicket: (ticketId) =>
    request(`/api/tickets/${ticketId}`, { method: "DELETE" }),

  addNote: (ticketId, data) =>
    request(`/api/tickets/${ticketId}/notes`, { method: "POST", body: JSON.stringify(data) }),
};
