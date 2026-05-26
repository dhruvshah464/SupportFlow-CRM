import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon, UserIcon, MailIcon, CalendarIcon,
  ClockIcon, MessageSquareIcon, SaveIcon, Trash2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { api } from "../api";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import { PageSpinner, Spinner } from "../components/Spinner";
import { useToast } from "../context/ToastContext";

const STATUSES = ["Open", "In Progress", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export function TicketDetailPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("Support Agent");
  const { show: showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function loadTicket() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTicket(ticketId);
      setTicket(data);
      setSelectedStatus(data.status);
      setSelectedPriority(data.priority);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTicket(); }, [ticketId]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateTicket(ticketId, {
        status: selectedStatus,
        priority: selectedPriority,
        note_text: noteText.trim() || undefined,
        author: noteAuthor,
      });
      setNoteText("");
      showToast("Ticket updated successfully.", "success");
      await loadTicket();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteTicket(ticketId);
      showToast("Ticket deleted.", "success");
      navigate("/dashboard");
    } catch (e) {
      showToast(e.message, "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) return <PageSpinner />;
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <AlertCircleIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-red-600 text-sm">{error}</p>
      <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">← Back to tickets</Link>
    </div>
  );
  if (!ticket) return null;

  const hasChanges =
    selectedStatus !== ticket.status ||
    selectedPriority !== ticket.priority ||
    noteText.trim().length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeftIcon className="w-4 h-4" /> Back to tickets
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-blue-600">{ticket.ticket_id}</span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Are you sure?</span>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger text-xs px-3 py-1.5">
                {deleting ? <Spinner size="sm" /> : null} Delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-xs px-3 py-1.5">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200">
              <Trash2Icon className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Details + Notes */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Info */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-gray-400" /> Customer Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{ticket.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <a href={`mailto:${ticket.customer_email}`} className="text-sm font-medium text-blue-600 hover:underline mt-0.5 block">
                  {ticket.customer_email}
                </a>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Created</p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {format(new Date(ticket.created_at), "PPP")}
                  <span className="text-gray-400 ml-1 text-xs">
                    ({formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 flex items-center gap-1"><ClockIcon className="w-3 h-3" /> Last Updated</p>
                <p className="text-sm text-gray-700 mt-0.5">
                  {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Issue Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Notes */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <MessageSquareIcon className="w-4 h-4 text-gray-400" />
              Notes & Activity
              {ticket.notes.length > 0 && (
                <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                  {ticket.notes.length}
                </span>
              )}
            </h2>

            {ticket.notes.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-4">No notes yet.</p>
            ) : (
              <div className="space-y-4">
                {ticket.notes.map((note) => (
                  <div key={note.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{note.author}</span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Update Panel */}
        <div className="space-y-5">
          <div className="card p-5 space-y-5">
            <h2 className="text-sm font-semibold text-gray-700">Update Ticket</h2>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Status</label>
              <div className="space-y-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedStatus === s
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Priority</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedPriority(p)}
                    className={`text-center px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedPriority === p
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Add Note</label>
              <input
                type="text"
                value={noteAuthor}
                onChange={(e) => setNoteAuthor(e.target.value)}
                placeholder="Your name"
                className="input text-xs mb-2"
              />
              <textarea
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a note…"
                className="input resize-none text-sm"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="btn-primary w-full justify-center"
            >
              {saving ? <Spinner size="sm" /> : <SaveIcon className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
