import { Link } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import Logo from "./Logo";

export default function PortalBar({ title, dark = false, right = null, onSignOut = null }) {
  return (
    <div
      className={`sticky top-0 z-30 border-b ${
        dark ? "border-white/10 bg-teal text-paper" : "border-paper-line bg-paper"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide opacity-70 hover:opacity-100 ${
              dark ? "text-paper" : "text-ink"
            }`}
          >
            <ArrowLeft size={14} /> Tablely
          </Link>
          <span className={`hidden h-4 w-px sm:block ${dark ? "bg-white/20" : "bg-paper-line"}`} />
          <span className={`hidden font-body text-sm font-semibold sm:block ${dark ? "text-paper" : "text-ink"}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {right}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-body text-xs font-medium transition-colors ${
                dark
                  ? "border-white/20 text-paper/70 hover:bg-white/10 hover:text-paper"
                  : "border-paper-line text-ink-soft hover:bg-paper-dim hover:text-ink"
              }`}
            >
              <LogOut size={12} /> Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
