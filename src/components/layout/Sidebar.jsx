import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, Building2, Compass, LogOut } from "lucide-react";
import { clearUser, getStoredBusiness } from "../../lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/tracked", icon: ClipboardCheck, label: "Tracked" },
  { path: "/profile", icon: Building2, label: "Profile" },
];

export default function Sidebar({ trackedCount = 0, onSignOut }) {
  const navigate = useNavigate();
  const location = useLocation();
  const business = getStoredBusiness();

  return (
    <aside className="sidebar hidden lg:flex">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 pl-6 pr-5 py-4 border-b cursor-pointer"
        style={{ borderColor: "var(--color-border)" }}
        onClick={() => navigate("/dashboard")}
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{ background: "var(--color-primary)" }}
        >
          <Compass size={16} strokeWidth={2} color="white" />
        </div>
        <div>
          <div className="font-bold text-sm leading-none" style={{ color: "var(--color-ink)" }}>
            MSME Compass
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>
            AI Scheme Finder
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`sidebar-nav-item w-full text-left ${
              location.pathname === path ? "active" : ""
            }`}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
            {/* Issue #10: badge with proper spacing — ml-auto + explicit min-w + padding */}
            {path === "/tracked" && trackedCount > 0 && (
              <span
                className="ml-auto font-bold rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "var(--color-primary)",
                  color: "white",
                  fontSize: "10px",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 5px",
                  marginLeft: "auto",
                }}
              >
                {trackedCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Business info + sign out */}
      <div
        className="pl-6 pr-4 py-4 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        {business && (
          <div className="mb-3 px-1">
            <div
              className="text-xs font-semibold truncate"
              style={{ color: "var(--color-ink)" }}
            >
              {business.name}
            </div>
            <div className="text-xs truncate" style={{ color: "var(--color-ink-muted)" }}>
              {business.sector}
            </div>
          </div>
        )}
        <button
          onClick={onSignOut}
          className="sidebar-nav-item w-full text-left"
          style={{ color: "var(--color-danger)" }}
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
