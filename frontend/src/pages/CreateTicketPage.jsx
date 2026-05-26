import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeftIcon, SendIcon, CheckCircleIcon } from "lucide-react";
import { api } from "../api";
import { Spinner } from "../components/Spinner";
import { useToast } from "../context/ToastContext";

import { Field } from "../components/Field";

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export function CreateTicketPage() {
  const navigate = useNavigate();
  const { show: showToast } = useToast();
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    subject: "",
    description: "",
    priority: "Medium",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function validate() {
    const errs = {};
    if (!form.customer_name.trim()) errs.customer_name = "Name is required";
    if (!form.customer_email.trim()) errs.customer_email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email))
      errs.customer_email = "Enter a valid email";
    if (!form.subject.trim()) errs.subject = "Subject is required";
    if (!form.description.trim()) errs.description = "Description is required";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const result = await api.createTicket(form);
      showToast(`Ticket ${result.ticket_id} created successfully.`, "success");
      setCreated(result);
    } catch (err) {
      setErrors({ _global: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircleIcon className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Ticket Created!</h2>
          <p className="text-sm text-gray-500">
            Your ticket has been submitted successfully.
          </p>
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-left space-y-1">
            <p className="text-xs text-gray-500">Ticket ID</p>
            <p className="font-mono font-bold text-blue-600 text-lg">{created.ticket_id}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Link to={`/dashboard/tickets/${created.ticket_id}`} className="btn-primary flex-1 justify-center">
              View Ticket
            </Link>
            <button
              onClick={() => { setCreated(null); setForm({ customer_name: "", customer_email: "", subject: "", description: "", priority: "Medium" }); }}
              className="btn-secondary flex-1 justify-center"
            >
              New Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeftIcon className="w-4 h-4" /> Back to tickets
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">Log a new customer issue.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {errors._global && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {errors._global}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5">
          <Field id="customer_name" label="Customer Name" required error={errors.customer_name}>
            <input
              id="customer_name"
              type="text"
              value={form.customer_name}
              onChange={set("customer_name")}
              placeholder="Jane Smith"
              className={`input ${errors.customer_name ? "border-red-300 focus:ring-red-500" : ""}`}
            />
          </Field>

          <Field id="customer_email" label="Customer Email" required error={errors.customer_email}>
            <input
              id="customer_email"
              type="email"
              value={form.customer_email}
              onChange={set("customer_email")}
              placeholder="jane@example.com"
              className={`input ${errors.customer_email ? "border-red-300 focus:ring-red-500" : ""}`}
            />
          </Field>
        </div>

        <Field id="subject" label="Issue Subject" required error={errors.subject}>
          <input
            id="subject"
            type="text"
            value={form.subject}
            onChange={set("subject")}
            placeholder="Brief summary of the issue"
            className={`input ${errors.subject ? "border-red-300 focus:ring-red-500" : ""}`}
          />
        </Field>

        <Field id="description" label="Description" required error={errors.description}>
          <textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={set("description")}
            placeholder="Describe the issue in detail…"
            className={`input resize-none ${errors.description ? "border-red-300 focus:ring-red-500" : ""}`}
          />
        </Field>

        <Field id="priority" label="Priority">
          <div className="flex gap-2 flex-wrap">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.priority === p
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>

        <div className="pt-2 flex gap-3">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? <Spinner size="sm" /> : <SendIcon className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Submit Ticket"}
          </button>
          <Link to="/dashboard" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
