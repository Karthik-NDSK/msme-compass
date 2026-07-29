import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default function AppShell({ children, trackedCount = 0 }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface-alt)" }}>
      <Sidebar trackedCount={trackedCount} />
      <div className="page-content">
        <TopBar />
        <main className="max-w-[1120px] mx-auto px-5 py-6">
          {children}
        </main>
      </div>
      <BottomNav trackedCount={trackedCount} />
    </div>
  );
}
