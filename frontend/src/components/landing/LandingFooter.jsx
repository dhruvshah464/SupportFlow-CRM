import { Link } from "react-router-dom";
import { HeadphonesIcon, GithubIcon, MailIcon } from "lucide-react";

const links = {
  Product: [
    { label: "Features",     href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Dashboard",    href: "/dashboard" },
  ],
  Links: [
    { label: "GitHub",  href: "https://github.com" },
    { label: "Contact", href: "mailto:dhruv464shah@gmail.com" },
  ],
};

function scrollTo(href) {
  if (href.startsWith("#")) {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }
}

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                <HeadphonesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-zinc-900 text-sm">
                Support<span className="text-blue-600">Flow</span>
              </span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mb-6">
              Customer support ticketing for teams that want to move fast.
            </p>
            <div className="flex items-center gap-3">
              {[
                { Icon: GithubIcon, href: "https://github.com",            label: "GitHub" },
                { Icon: MailIcon,   href: "mailto:dhruv464shah@gmail.com", label: "Email"  },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-all"
                  aria-label={label}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4">
                {section}
              </h3>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    {item.href.startsWith("/") ? (
                      <Link to={item.href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                        {item.label}
                      </Link>
                    ) : item.href.startsWith("#") ? (
                      <button onClick={() => scrollTo(item.href)} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                        {item.label}
                      </button>
                    ) : (
                      <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            © 2026 SupportFlow CRM. Built for the Datastraw Technologies assessment.
          </p>
          <div className="flex items-center gap-1.5">
            {["React", "FastAPI", "Tailwind CSS", "Render"].map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-500">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
