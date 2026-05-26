import { motion } from "framer-motion";
import {
  TicketIcon, SearchIcon, MessageSquareIcon,
  LayersIcon, SmartphoneIcon,
} from "lucide-react";

const features = [
  {
    icon: TicketIcon,
    title: "Ticket Management",
    description: "Create tickets with customer details, auto-generated IDs, and priority levels. Track every issue from open to resolved.",
    color: "blue",
  },
  {
    icon: SearchIcon,
    title: "Search & Filters",
    description: "Find any ticket instantly. Search across IDs, names, emails, and descriptions. Filter by status or priority.",
    color: "violet",
  },
  {
    icon: MessageSquareIcon,
    title: "Internal Notes",
    description: "Add notes to any ticket to track investigation progress and hand off context between team members.",
    color: "emerald",
  },
  {
    icon: LayersIcon,
    title: "Status & Priority Tracking",
    description: "Move tickets through Open → In Progress → Closed. Set priority from Low to Urgent so your team knows what to tackle first.",
    color: "amber",
  },
  {
    icon: SmartphoneIcon,
    title: "Works on Any Screen",
    description: "Responsive layout that works on desktop, tablet, and mobile — so you can check tickets from anywhere.",
    color: "cyan",
  },
];

const iconColors = {
  blue:    "bg-blue-50 text-blue-600",
  violet:  "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber:   "bg-amber-50 text-amber-600",
  cyan:    "bg-cyan-50 text-cyan-600",
};

export function Features() {
  return (
    <section id="features" className="py-28 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Features
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 mb-4 leading-tight">
            Everything your team needs,{" "}
            <span className="text-blue-600">nothing it doesn't</span>
          </h2>
          <p className="text-zinc-500 text-base sm:text-lg max-w-2xl mx-auto">
            A focused set of tools for managing customer support — built for speed and clarity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.08)" }}
              className="group bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:border-zinc-300 transition-all duration-300 cursor-default"
            >
              <div className={`w-11 h-11 rounded-xl ${iconColors[f.color]} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-zinc-900 font-semibold text-base mb-2 leading-snug">{f.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
