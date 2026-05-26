import { AnimatePresence, motion } from "framer-motion";
import { CheckCircleIcon, XCircleIcon, InfoIcon, XIcon } from "lucide-react";
import { useToast } from "../context/ToastContext";

const icons = {
  success: <CheckCircleIcon className="w-4 h-4 text-emerald-600" />,
  error: <XCircleIcon className="w-4 h-4 text-red-500" />,
  info: <InfoIcon className="w-4 h-4 text-blue-500" />,
};

const styles = {
  success: "border-emerald-200 bg-white",
  error: "border-red-200 bg-white",
  info: "border-blue-200 bg-white",
};

export function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium text-zinc-800 min-w-[240px] max-w-sm ${styles[t.type] || styles.info}`}
          >
            {icons[t.type] || icons.info}
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors flex-shrink-0"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
