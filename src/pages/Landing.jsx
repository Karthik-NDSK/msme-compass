import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, FileSearch, ArrowRight, Building2, Target, Bell } from "lucide-react";
import { setUser, generateUserId, getUser } from "../lib/utils";

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function handleSignIn() {
    setLoading(true);
    // Simple hackathon auth — create/reuse a user session
    let user = getUser();
    if (!user) {
      user = { id: generateUserId(), name: "MSME Owner", createdAt: Date.now() };
      setUser(user);
    }
    setTimeout(() => navigate("/onboarding"), 400);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "var(--color-surface-alt)" }}
    >
      {/* Card */}
      <div
        className="w-full rounded-2xl p-8 sm:p-10"
        style={{
          maxWidth: "460px",
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-hover)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: "var(--color-primary)" }}
          >
            <Compass size={28} strokeWidth={1.75} color="white" />
          </div>
          <div className="text-center">
            <div className="font-bold text-lg" style={{ color: "var(--color-ink)" }}>
              MSME Compass
            </div>
            <div className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
              AI Scheme-Matching Copilot
            </div>
          </div>
        </div>

        {/* Headline per DESIGN.md §3.1 */}
        <h1
          className="font-bold text-center mb-3 leading-snug"
          style={{ fontSize: "var(--text-2xl)", color: "var(--color-ink)" }}
        >
          Find every scheme your business qualifies for
        </h1>
        <p
          className="text-center mb-8"
          style={{ fontSize: "var(--text-base)", color: "var(--color-ink-muted)" }}
        >
          Most Indian MSMEs miss out on government subsidies, certifications, and funding — not
          because they're ineligible, but because no one told them.
        </p>

        {/* Sign-in CTA */}
        <button
          id="get-started-btn"
          onClick={handleSignIn}
          disabled={loading}
          className="btn-primary w-full text-base py-3 rounded-lg"
        >
          {loading ? (
            <span>Getting started…</span>
          ) : (
            <>
              Get started free
              <ArrowRight size={18} strokeWidth={1.75} />
            </>
          )}
        </button>

        {/* Trust signals */}
        <div
          className="mt-6 pt-6 border-t flex items-center justify-center gap-1 text-xs"
          style={{ borderColor: "var(--color-border)", color: "var(--color-ink-muted)" }}
        >
          <span>Powered by Google Gemini AI · SDG 9 Innovation</span>
        </div>
      </div>

      {/* Features */}
      <div className="mt-10 w-full grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ maxWidth: "760px" }}>
        {[
          {
            icon: FileSearch,
            title: "Upload once",
            desc: "OCR reads your Udyam or GST certificate automatically",
          },
          {
            icon: Target,
            title: "Instant matches",
            desc: "AI ranks schemes you qualify for with plain-language reasons",
          },
          {
            icon: Bell,
            title: "Track deadlines",
            desc: "Never miss an application window again",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl p-5 text-center"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3"
              style={{ background: "var(--color-primary-light)" }}
            >
              <Icon size={20} strokeWidth={1.75} color="var(--color-primary)" />
            </div>
            <div className="font-semibold text-sm mb-1" style={{ color: "var(--color-ink)" }}>
              {title}
            </div>
            <div className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
              {desc}
            </div>
          </div>
        ))}
      </div>

      {/* SDG badge */}
      <div
        className="mt-8 text-xs text-center"
        style={{ color: "var(--color-ink-muted)" }}
      >
        <span>FutureForge Hackathon · SDG 9 (Industry, Innovation &amp; Infrastructure)</span>
      </div>
    </div>
  );
}
