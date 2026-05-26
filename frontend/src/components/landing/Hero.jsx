import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

function HeroMockup() {
  const rows = [
    { id: "TKT-0001", name: "Alice Chen",  subject: "Login broken on Safari",    status: "In Progress", sBg: "bg-blue-50",    sTx: "text-blue-700",    pBg: "bg-red-50",     pTx: "text-red-700",    p: "High" },
    { id: "TKT-0002", name: "Bob Torres",  subject: "Payment not going through",  status: "Open",        sBg: "bg-emerald-50", sTx: "text-emerald-700", pBg: "bg-orange-50",  pTx: "text-orange-700", p: "Urgent" },
    { id: "TKT-0003", name: "Carol Patel", subject: "CSV export missing columns", status: "Closed",      sBg: "bg-zinc-50",    sTx: "text-zinc-600",    pBg: "bg-slate-50",   pTx: "text-slate-600",  p: "Low" },
    { id: "TKT-0004", name: "David Kim",   subject: "API timeout on bulk ops",    status: "Open",        sBg: "bg-emerald-50", sTx: "text-emerald-700", pBg: "bg-red-50",     pTx: "text-red-700",    p: "High" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-4xl mx-auto"
    >
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-100 via-indigo-50 to-violet-100 blur-xl opacity-80" />

      <div className="relative rounded-xl overflow-hidden border border-zinc-200 shadow-2xl shadow-zinc-200/80 bg-white">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 h-9 bg-zinc-50 border-b border-zinc-200">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-white border border-zinc-200 rounded px-3 py-0.5 text-[10px] text-zinc-500 font-mono">
              supportflow.app/dashboard
            </div>
          </div>
          <div className="w-16" />
        </div>

        {/* Dashboard content */}
        <div className="flex h-[340px] sm:h-[380px]">
          {/* Sidebar */}
          <div className="hidden sm:flex w-44 flex-col bg-zinc-50 border-r border-zinc-200 p-3 gap-0.5 flex-shrink-0">
            <div className="flex items-center gap-2 px-2 py-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-blue-600 flex-shrink-0" />
              <span className="text-zinc-900 text-xs font-semibold">SupportFlow</span>
            </div>
            {[
              { label: "Dashboard", active: false },
              { label: "Tickets",   active: true  },
              { label: "New Ticket", active: false },
            ].map(({ label, active }) => (
              <div
                key={label}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-500"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div className="flex-1 bg-white p-3 sm:p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-[11px] text-zinc-400">
                Search tickets…
              </div>
              <div className="bg-blue-600 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-medium whitespace-nowrap">
                + New Ticket
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Open",        value: "5",  color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                { label: "In Progress", value: "3",   color: "text-blue-700",    bg: "bg-blue-50 border-blue-200"      },
                { label: "Closed",      value: "12",  color: "text-zinc-700",    bg: "bg-zinc-50 border-zinc-200"      },
              ].map((s) => (
                <div key={s.label} className={`border rounded-lg p-2.5 ${s.bg}`}>
                  <div className={`text-base sm:text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-[80px_1fr_80px] sm:grid-cols-[88px_1fr_90px_60px] border-b border-zinc-100 px-3 py-1.5 bg-zinc-50">
                {["ID", "Customer", "Status", "Priority"].map((h) => (
                  <span key={h} className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">{h}</span>
                ))}
              </div>
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[80px_1fr_80px] sm:grid-cols-[88px_1fr_90px_60px] px-3 py-2 border-b border-zinc-50 items-center"
                >
                  <span className="text-[10px] text-blue-600 font-mono">{r.id}</span>
                  <div>
                    <div className="text-[11px] text-zinc-800 font-medium leading-tight">{r.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate leading-tight hidden sm:block">{r.subject}</div>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${r.sBg} ${r.sTx} w-fit border`}>
                    {r.status}
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${r.pBg} ${r.pTx} w-fit hidden sm:inline border`}>
                    {r.p}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-12 px-4 bg-white">
      <div className="absolute inset-0 bg-dot-grid pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto w-full text-center">
        {/* Badge */}
        <motion.div {...fadeUp(0)} className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Customer Support CRM
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1 {...fadeUp(0.1)} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-900 leading-[1.08] tracking-tight mb-6">
          Customer support that
          <br />
          <span className="text-blue-600">actually works</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.2)}
          className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-500 leading-relaxed mb-10"
        >
          Create tickets, track issues, and collaborate with your team — all from one clean workspace.
        </motion.p>

        {/* CTAs */}
        <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all text-sm"
          >
            Get started free
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <button
            onClick={() => document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold rounded-xl transition-all text-sm shadow-sm"
          >
            See features
          </button>
        </motion.div>

        {/* Dashboard mockup */}
        <HeroMockup />
      </div>
    </section>
  );
}
