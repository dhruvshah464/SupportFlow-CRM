import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { SearchIcon, FilterIcon, PlusIcon, TicketIcon, RefreshCwIcon } from "lucide-react";
import { format } from "date-fns";
import { api } from "../api";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import { StatCard } from "../components/StatCard";
import { PageSpinner } from "../components/Spinner";
import { EmptyState } from "../components/EmptyState";

const STATUSES = ["All", "Open", "In Progress", "Closed"];
const PRIORITIES = ["All", "Low", "Medium", "High", "Urgent"];

export function HomePage() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketData, statsData] = await Promise.all([
        api.listTickets({
          status: statusFilter !== "All" ? statusFilter : undefined,
          priority: priorityFilter !== "All" ? priorityFilter : undefined,
          search: debouncedSearch || undefined,
        }),
        api.getStats(),
      ]);
      setTickets(ticketData);
      setStats(statsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, debouncedSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Stats Row */}
      {stats && (
        <div data-tour="dashboard-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Tickets" value={stats.total} color="blue" icon={TicketIcon} />
          <StatCard label="Open" value={stats.open} color="emerald" icon={TicketIcon} />
          <StatCard label="In Progress" value={stats.in_progress} color="amber" icon={TicketIcon} />
          <StatCard label="Closed" value={stats.closed} color="gray" icon={TicketIcon} />
        </div>
      )}

      {/* Toolbar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, ID, or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="btn-secondary">
              <RefreshCwIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link to="/dashboard/new" data-tour="new-ticket" className="btn-primary">
              <PlusIcon className="w-4 h-4" />
              New Ticket
            </Link>
          </div>
        </div>

        {/* Filter Chips */}
        <div data-tour="filters" className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <FilterIcon className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-gray-500 font-medium">Priority:</span>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  priorityFilter === p
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <PageSpinner />
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : tickets.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Ticket ID", "Customer", "Subject", "Priority", "Status", "Notes", "Created"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tickets.map((t) => (
                    <tr
                      key={t.ticket_id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/dashboard/tickets/${t.ticket_id}`}
                          className="font-mono text-xs font-medium text-blue-600 group-hover:text-blue-700"
                        >
                          {t.ticket_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/dashboard/tickets/${t.ticket_id}`} className="block">
                          <p className="font-medium text-gray-900">{t.customer_name}</p>
                          <p className="text-xs text-gray-500">{t.customer_email}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <Link
                          to={`/dashboard/tickets/${t.ticket_id}`}
                          className="text-gray-700 hover:text-gray-900 line-clamp-1"
                        >
                          {t.subject}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {t.note_count > 0 ? (
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {t.note_count}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(t.created_at), "MMM d, yyyy")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {tickets.map((t) => (
                <Link
                  key={t.ticket_id}
                  to={`/dashboard/tickets/${t.ticket_id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs text-blue-600 font-medium">{t.ticket_id}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="font-medium text-gray-900 text-sm mb-0.5">{t.customer_name}</p>
                  <p className="text-xs text-gray-500 mb-1">{t.customer_email}</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{t.subject}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <PriorityBadge priority={t.priority} />
                    <span className="text-xs text-gray-400">
                      {format(new Date(t.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing <span className="font-medium">{tickets.length}</span> ticket{tickets.length !== 1 ? "s" : ""}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
