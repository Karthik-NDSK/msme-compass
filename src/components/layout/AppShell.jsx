import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import { clearUser } from "../../lib/utils";
import { LogOut, X } from "lucide-react";

export default function AppShell({ children, trackedCount = 0 }) {
  const [showSignOut, setShowSignOut] = useState(false);
  const navigate = useNavigate();

  function handleConfirmSignOut() {
    clearUser();
    navigate("/");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-alt)" }}>
      <Sidebar trackedCount={trackedCount} onSignOut={() => setShowSignOut(true)} />
      <div className="page-content">
        <TopBar onSignOut={() => setShowSignOut(true)} />
        <main className="max-w-[1120px] mx-auto px-5 py-6">
          {children}
        </main>
      </div>
      <BottomNav trackedCount={trackedCount} />

      {/* Sign Out Confirmation Modal */}
      {showSignOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSignOut(false)} />
          <div className="card relative w-full max-w-sm overflow-hidden p-0 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500 mb-2">
                  <LogOut size={20} strokeWidth={2} />
                </div>
                <button onClick={() => setShowSignOut(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--color-ink)" }}>Sign out</h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-ink-muted)" }}>
                Are you sure you want to sign out? Your business profile and tracked schemes will be preserved.
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setShowSignOut(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSignOut}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-semibold text-sm transition-colors cursor-pointer border-0 text-white"
                  style={{ background: "var(--color-danger, #ef4444)" }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
