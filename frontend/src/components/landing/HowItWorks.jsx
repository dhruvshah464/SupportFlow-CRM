import { motion } from "framer-motion";
import { PlusCircleIcon, SlidersIcon, CheckCircleIcon, ArrowRightIcon } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: PlusCircleIcon,
    title: "Create a Ticket",
    description: "Log an issue with customer name, email, subject, and description. Each ticket gets a unique auto-generated ID.",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    num: "bg-blue-600 text-white",
  },
  {
    number: "02",
    icon: SlidersIcon,
    title: "Track & Update",
    description: "Use the dashboard to search, filter, and update tickets. Add internal notes to keep your team in the loop.",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-600",
    num: "bg-violet-600 text-white",
  },
  {
    number: "03",
    icon: CheckCircleIcon,
    title: "Resolve & Close",
    description: "Move tickets to Closed when they're done. The dashboard stats update automatically so you always know where things stand.",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-600",
    num: "bg-emerald-600 text-white",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-4 bg-zinc-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 mb-4 leading-tight">
            Up and running in{" "}
            <span className="text-blue-600">three steps</span>
          </h2>
          <p className="text-zinc-500 text-base sm:text-lg max-w-2xl mx-auto">
            Sign up, create your first ticket, and start tracking issues. No setup required.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[calc(33.3%+16px)] right-[calc(33.3%+16px)] h-px bg-zinc-200">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.5 }}
              style={{ originX: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400"
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              <motion.div
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`w-24 h-24 rounded-3xl ${step.bg} border ${step.border} flex items-center justify-center mb-6 shadow-sm relative`}
              >
                <step.icon className={`w-10 h-10 ${step.text}`} />
                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${step.num} flex items-center justify-center shadow-sm`}>
                  <span className="text-[10px] font-bold">{i + 1}</span>
                </div>
              </motion.div>

              <div className={`text-xs font-bold ${step.text} tracking-widest uppercase mb-3`}>
                Step {step.number}
              </div>
              <h3 className="text-zinc-900 font-bold text-lg mb-3 leading-snug">{step.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">{step.description}</p>

              {i < steps.length - 1 && (
                <div className="md:hidden flex justify-center mt-6">
                  <ArrowRightIcon className="w-5 h-5 text-zinc-300 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
