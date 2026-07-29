import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BookmarkPlus, BookmarkCheck, ExternalLink, Clock,
  SearchX, Loader2, AlertTriangle, Target, ClipboardCheck,
} from "lucide-react";
import AppShell from "../components/layout/AppShell";
import AICallout from "../components/ui/AICallout";
import { useToast } from "../components/ui/Toast";
import {
  formatDeadline,
  getDeadlineClass,
  getCategoryClass,
  getStoredBusiness,
  CATEGORIES,
} from "../lib/utils";
import { filterSchemesByRules, computeBaseScore } from "../lib/schemeFilter";
import { generateEligibilityReasons } from "../lib/gemini";
import {
  useBusinessGet,
  useMatchesByBusiness,
  useTrackedByBusiness,
  useSaveMatches,
  useTrackScheme,
  useSchemesList,
  useSeedSchemes
} from "../lib/backend";

// ── Match Score Badge with progress ring (#2) ─────────────────────────────────
function MatchBadgeWithRing({ score }) {
  const r = 10;
  const circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;

  let colorVar, bgClass, textClass;
  if (score >= 80) {
    colorVar = "var(--color-match-high)";
    bgClass = "match-badge match-badge-high";
  } else if (score >= 50) {
    colorVar = "var(--color-match-mid)";
    bgClass = "match-badge match-badge-mid";
  } else {
    colorVar = "var(--color-match-low)";
    bgClass = "match-badge match-badge-low";
  }

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0" aria-label={`${score}% match`}>
      {/* Radial progress ring */}
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        {/* Track */}
        <circle
          cx="13" cy="13" r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ color: "var(--color-border)", opacity: 0.8 }}
        />
        {/* Progress */}
        <circle
          cx="13" cy="13" r={r}
          fill="none"
          stroke={colorVar}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={fill}
          transform="rotate(-90 13 13)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {/* Text pill */}
      <span className={bgClass} style={{ fontSize: "11px", padding: "2px 8px" }}>
        {score}%
      </span>
    </div>
  );
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const storedBusiness = getStoredBusiness();
  const businessId = location.state?.businessId || storedBusiness?.id;

  const [generating, setGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("match");

  const business = useBusinessGet(businessId);
  const [matches, refetchMatches] = useMatchesByBusiness(businessId);
  const [trackedData, refetchTracked] = useTrackedByBusiness(businessId);
  const saveMatches = useSaveMatches();
  const trackScheme = useTrackScheme();
  const allSchemes = useSchemesList();
  const seedSchemes = useSeedSchemes();

  useEffect(() => { seedSchemes(); }, [seedSchemes]);

  useEffect(() => {
    if (!business || !businessId) return;
    if (matches === undefined) return;
    if (matches.length > 0) return;
    if (generating) return;
    if (!allSchemes) return;
    runMatching();
  }, [business, matches, businessId, allSchemes]);

  async function runMatching() {
    if (!allSchemes) return;
    setGenerating(true);
    try {
      const filtered = filterSchemesByRules(business, allSchemes);
      let reasons;
      if (filtered.length === 0) {
        reasons = allSchemes.slice(0, 10).map((scheme) => ({
          schemeId: scheme._id,
          matchScore: computeBaseScore(business, scheme),
          reason: `${business.name} meets the baseline eligibility requirements for ${scheme.name}.`,
        }));
      } else {
        reasons = await generateEligibilityReasons(business, filtered);
      }
      await saveMatches({ businessId, matches: reasons });
      refetchMatches();
    } catch (err) {
      console.error("Matching failed:", err);
      try {
        const filtered = filterSchemesByRules(business, allSchemes);
        const fallback = (filtered.length > 0 ? filtered : allSchemes.slice(0, 8)).map((s) => ({
          schemeId: s._id,
          matchScore: computeBaseScore(business, s),
          reason: `Your business profile meets the core eligibility criteria for ${s.name}.`,
        }));
        await saveMatches({ businessId, matches: fallback });
        refetchMatches();
      } catch (e2) {
        console.error("Fallback matching also failed:", e2);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleTrack(schemeId) {
    try {
      await trackScheme({ businessId, schemeId });
      refetchTracked();
      showToast("Scheme added to your tracker!");
    } catch (err) { console.error(err); }
  }

  const trackedSchemeIds = new Set(trackedData?.map((t) => t.schemeId) || []);

  let displayedMatches = matches || [];
  if (activeCategory !== "All") {
    displayedMatches = displayedMatches.filter((m) => m.scheme?.category === activeCategory);
  }
  if (sortBy === "deadline") {
    displayedMatches = [...displayedMatches].sort((a, b) => {
      const ad = a.scheme?.deadline || Infinity;
      const bd = b.scheme?.deadline || Infinity;
      return ad - bd;
    });
  }

  // Stats for the summary strip (#9)
  const allMatches = matches || [];
  const closingSoon = allMatches.filter((m) => {
    if (!m.scheme?.deadline) return false;
    const days = Math.ceil((m.scheme.deadline - Date.now()) / 86400000);
    return days >= 0 && days <= 14;
  }).length;

  const isLoading = business === undefined || generating;

  if (!businessId) {
    return (
      <AppShell>
        <div className="empty-state">
          <SearchX size={48} strokeWidth={1.5} className="empty-state-icon" />
          <h2 className="font-semibold text-lg mb-2">No business profile found</h2>
          <p className="mb-4">Set up your profile to see matched schemes.</p>
          <button className="btn-primary" onClick={() => navigate("/onboarding")}>Set up profile</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell trackedCount={trackedData?.length || 0}>
      <div className="space-y-5">

        {/* ── Page header ────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="font-bold mb-0.5"
              style={{ fontSize: "var(--text-xl)", color: "var(--color-ink)" }}
            >
              {isLoading
                ? "Finding your schemes…"
                : `${allMatches.length} scheme${allMatches.length !== 1 ? "s" : ""} matched`}
              {business && !isLoading && (
                <span style={{ color: "var(--color-ink-muted)", fontWeight: 400 }}>
                  {" "}for {business.name}
                </span>
              )}
            </h1>
            {business && (
              <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
                {business.sector} · {business.state} · {business.registrationType}
              </p>
            )}
          </div>
          {matches && matches.length > 0 && (
            <button className="btn-secondary text-sm" onClick={runMatching} disabled={generating}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : null}
              Refresh matches
            </button>
          )}
        </div>

        {/* ── Stats summary strip (#9) ────────────────────────────── */}
        {!isLoading && allMatches.length > 0 && (
          <div
            className="flex items-center gap-4 flex-wrap rounded-xl px-4 py-3"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <StatPill
              icon={<Target size={13} strokeWidth={1.75} />}
              value={allMatches.length}
              label="matched"
              color="var(--color-primary)"
              bg="var(--color-primary-light)"
            />
            <div style={{ width: "1px", height: "20px", background: "var(--color-border)" }} />
            <StatPill
              icon={<ClipboardCheck size={13} strokeWidth={1.75} />}
              value={trackedData?.length || 0}
              label="tracked"
              color="var(--color-accent)"
              bg="var(--color-accent-light)"
            />
            {closingSoon > 0 && (
              <>
                <div style={{ width: "1px", height: "20px", background: "var(--color-border)" }} />
                <StatPill
                  icon={<AlertTriangle size={13} strokeWidth={1.75} />}
                  value={closingSoon}
                  label="closing soon"
                  color="var(--color-warning)"
                  bg="#FEF3CD"
                />
              </>
            )}
          </div>
        )}

        {/* ── Loading skeletons ────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="skeleton w-6 h-6 rounded-full" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-5 w-20 rounded-full ml-2" />
                  <div className="skeleton h-4 w-28 rounded ml-auto" />
                </div>
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-14 w-full rounded-lg" />
                <div className="skeleton h-4 w-40 rounded" />
              </div>
            ))}
            <p className="text-sm text-center py-2" style={{ color: "var(--color-ink-muted)" }}>
              <Loader2 size={15} className="inline animate-spin mr-1.5" />
              {generating ? "AI is analysing which schemes you qualify for…" : "Loading…"}
            </p>
          </div>
        )}

        {/* ── Filter + Sort bar (#8: tighter layout) ───────────────── */}
        {!isLoading && allMatches.length > 0 && (
          <div
            className="flex items-center gap-2 flex-wrap rounded-xl px-3 py-2.5"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="filter-bar flex-1 min-w-0">
              {["All", ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  id={`filter-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`chip text-xs ${activeCategory === cat ? "chip-selected" : ""}`}
                  style={{ padding: "4px 12px" }}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Separator + sort — right-aligned (#8) */}
            <div
              className="hidden sm:block self-stretch"
              style={{ width: "1px", background: "var(--color-border)", margin: "0 4px" }}
            />
            <select
              id="sort-select"
              className="form-select text-xs flex-shrink-0"
              style={{ width: "auto", minWidth: "140px", padding: "6px 32px 6px 10px" }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="match">Best match</option>
              <option value="deadline">Nearest deadline</option>
            </select>
          </div>
        )}

        {/* ── Empty state after filtering ──────────────────────────── */}
        {!isLoading && displayedMatches.length === 0 && allMatches.length > 0 && (
          <div className="empty-state">
            <SearchX size={48} strokeWidth={1.5} className="empty-state-icon" />
            <h3 className="font-semibold text-lg mb-2">No schemes in this category</h3>
            <p>Try a different filter to see all matched schemes.</p>
          </div>
        )}

        {/* ── Scheme cards (vertical list) ─────────────────────────── */}
        <div className="space-y-3">
          {!isLoading &&
            displayedMatches.map((match) => (
              <SchemeCard
                key={match._id}
                match={match}
                isTracked={trackedSchemeIds.has(match.schemeId)}
                onTrack={() => handleTrack(match.schemeId)}
              />
            ))}
        </div>

      </div>
      <ToastContainer />
    </AppShell>
  );
}

// ── Stat Pill (for summary strip) ─────────────────────────────────────────────

function StatPill({ icon, value, label, color, bg }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      <span
        className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
        style={{ background: bg }}
      >
        {icon}
      </span>
      <span className="font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
      <span style={{ color: "var(--color-ink-muted)", fontWeight: 400 }}>{label}</span>
    </div>
  );
}

// ── Scheme Card ───────────────────────────────────────────────────────────────

function SchemeCard({ match, isTracked, onTrack }) {
  const { scheme, matchScore, reason } = match;
  if (!scheme) return null;

  const deadlineText = formatDeadline(scheme.deadline);
  const deadlineClass = getDeadlineClass(scheme.deadline);
  const catClass = getCategoryClass(scheme.category);

  // Deadline urgency: determine icon (#5)
  const now = Date.now();
  const daysLeft = scheme.deadline
    ? Math.ceil((scheme.deadline - now) / 86400000)
    : null;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const DeadlineIcon = isUrgent || isExpired ? AlertTriangle : Clock;

  return (
    <article
      className="card"
      id={`scheme-${match.schemeId}`}
      style={{ padding: "var(--space-4)" }}  /* #1: tighter card padding */
    >
      {/* ── Card header row (#3: clear hierarchy) ───────────────── */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {/* Match badge + ring (#2) */}
        <MatchBadgeWithRing score={matchScore} />

        {/* Category chip */}
        <span className={catClass} style={{ fontSize: "11px" }}>{scheme.category}</span>

        {/* Authority — clearly muted, right-aligned (#3) */}
        <span
          className="ml-auto text-xs leading-tight text-right"
          style={{ color: "var(--color-ink-muted)", maxWidth: "180px" }}
        >
          {scheme.authority}
        </span>
      </div>

      {/* ── Scheme name — clear focal point (#3) ─────────────────── */}
      <h2
        className="font-semibold leading-snug mb-1.5"
        style={{ fontSize: "var(--text-lg)", color: "var(--color-ink)" }}
      >
        {scheme.name}
      </h2>

      {/* ── Benefit description (#1: tighter gap) ────────────────── */}
      <p
        className="text-sm mb-2"
        style={{ color: "var(--color-ink-muted)", lineHeight: "1.5" }}
      >
        {scheme.benefit}
      </p>

      {/* ── AI callout (#4: tighter icon gap, left border accent) ── */}
      <AICallout text={reason} className="mb-2" />

      {/* ── Deadline (#5: urgency fully wired with color + icon) ──── */}
      <div
        className={`flex items-center gap-1.5 text-xs mb-3 ${deadlineClass}`}
        style={{ fontWeight: isUrgent || isExpired ? 600 : 400 }}
      >
        <DeadlineIcon size={13} strokeWidth={isUrgent || isExpired ? 2 : 1.75} />
        <span>
          {isExpired
            ? `Deadline passed (${deadlineText})`
            : scheme.deadline
            ? `Deadline: ${deadlineText}${isUrgent ? " — apply now!" : ""}`
            : "Rolling deadline"}
        </span>
      </div>

      {/* ── Actions (#6: tracked state clearly distinct) ──────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {isTracked ? (
          /* Tracked state — filled primary-light background, primary text (#6) */
          <button
            id={`track-${match.schemeId}`}
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-semibold cursor-default"
            style={{
              background: "var(--color-primary-light)",
              color: "var(--color-primary-dark)",
              border: "1.5px solid var(--color-primary)",
            }}
            aria-label="Already tracking this scheme"
          >
            <BookmarkCheck size={15} strokeWidth={2} />
            Tracking
          </button>
        ) : (
          /* Untracked state — solid primary button (#6) */
          <button
            id={`track-${match.schemeId}`}
            onClick={onTrack}
            className="btn-primary text-sm py-2 px-3"
            aria-label={`Track ${scheme.name}`}
          >
            <BookmarkPlus size={15} strokeWidth={1.75} />
            Track this scheme
          </button>
        )}

        <a
          href={scheme.applyUrl}
          id={`apply-${match.schemeId}`}
          className="btn-ghost text-sm py-2 px-3"
        >
          View details
          <ExternalLink size={13} strokeWidth={1.75} />
        </a>
      </div>
    </article>
  );
}
