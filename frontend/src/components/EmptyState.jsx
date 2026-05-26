import { Link } from "react-router-dom";
import { InboxIcon, PlusIcon } from "lucide-react";

export function EmptyState({
  title = "No tickets yet",
  description = "Create your first ticket to get started.",
  showCreate = true,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4 border border-zinc-200">
        <InboxIcon className="w-7 h-7 text-zinc-400" />
      </div>
      <p className="text-sm font-semibold text-zinc-800">{title}</p>
      <p className="text-xs text-zinc-500 mt-1 max-w-xs">{description}</p>
      {showCreate && (
        <Link to="/dashboard/new" className="btn-primary mt-5">
          <PlusIcon className="w-4 h-4" />
          Create ticket
        </Link>
      )}
    </div>
  );
}
