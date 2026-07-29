import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, ChevronDown, LogOut } from "lucide-react";
import { getStoredBusiness, clearUser } from "../../lib/utils";

export default function TopBar({ onSignOut }) {
  const navigate = useNavigate();
  const business = getStoredBusiness();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="topbar">
      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg"
          style={{ background: "var(--color-primary)" }}
        >
          <Compass size={14} strokeWidth={2} color="white" />
        </div>
        <span className="font-bold text-sm" style={{ color: "var(--color-ink)" }}>
          MSME Compass
        </span>
      </div>

      {/* Desktop: empty left (sidebar handles branding) */}
      <div className="hidden lg:block" />

      {/* Right: business name + interactive avatar dropdown (#7) */}
      <div className="relative flex items-center gap-3">
        {business && (
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
              {business.name}
            </div>
            <div className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
              {business.state} · {business.registrationType}
            </div>
          </div>
        )}

        {/* Avatar button — clearly interactive with chevron (#7) */}
        <button
          id="topbar-account-btn"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-1 rounded-full pr-1 transition-colors"
          style={{
            background: menuOpen ? "var(--color-surface-alt)" : "transparent",
            border: "1.5px solid var(--color-border)",
            padding: "2px 6px 2px 2px",
          }}
          aria-label="Account menu"
          aria-expanded={menuOpen}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            {business?.name?.[0]?.toUpperCase() || "M"}
          </div>
          <ChevronDown
            size={13}
            strokeWidth={2}
            style={{
              color: "var(--color-ink-muted)",
              transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
            }}
          />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl z-50 py-1"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-hover)",
              }}
            >
              {business && (
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div className="text-xs font-semibold truncate" style={{ color: "var(--color-ink)" }}>
                    {business.name}
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
                    {business.sector}
                  </div>
                </div>
              )}
              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                style={{ color: "var(--color-danger)" }}
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut();
                }}
                onMouseOver={e => e.currentTarget.style.background = "var(--color-surface-alt)"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                <LogOut size={14} strokeWidth={1.75} />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
