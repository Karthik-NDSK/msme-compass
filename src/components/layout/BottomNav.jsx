import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, Building2 } from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/tracked", icon: ClipboardCheck, label: "Tracked" },
  { path: "/profile", icon: Building2, label: "Profile" },
];

export default function BottomNav({ trackedCount = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav lg:hidden">
      {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`bottom-nav-item ${active ? "active" : ""}`}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={1.75} />
              {path === "/tracked" && trackedCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 text-xs font-bold rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--color-primary)",
                    color: "white",
                    width: "16px",
                    height: "16px",
                    fontSize: "9px",
                  }}
                >
                  {trackedCount}
                </span>
              )}
            </div>
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
