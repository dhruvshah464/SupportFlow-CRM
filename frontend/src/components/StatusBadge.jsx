export function StatusBadge({ status }) {
  const map = {
    Open: "badge-open",
    "In Progress": "badge-progress",
    Closed: "badge-closed",
  };
  return <span className={map[status] || "badge-open"}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  const map = {
    Low: "badge-low",
    Medium: "badge-medium",
    High: "badge-high",
    Urgent: "badge-urgent",
  };
  return <span className={map[priority] || "badge-medium"}>{priority}</span>;
}
