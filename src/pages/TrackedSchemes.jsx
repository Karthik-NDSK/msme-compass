import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Clock, ExternalLink, BookmarkX } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { useToast } from "../components/ui/Toast";
import {
  formatDeadline,
  getDeadlineClass,
  getCategoryClass,
  STATUS_OPTIONS,
  getStoredBusiness,
} from "../lib/utils";
import {
  useTrackedByBusiness,
  useUpdateStatus,
  useUntrack,
} from "../lib/backend";

export default function TrackedSchemes() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const storedBusiness = getStoredBusiness();
  const businessId = storedBusiness?.id;

  const [trackedData, refetchTracked] = useTrackedByBusiness(businessId);
  const updateStatus = useUpdateStatus();
  const untrack = useUntrack();

  const [notes, setNotes] = useState({});
  const [editingNotes, setEditingNotes] = useState(null);

  async function handleStatusChange(trackedId, newStatus) {
    await updateStatus({ trackedId, status: newStatus });
    refetchTracked();
    showToast("Status updated");
  }

  async function handleNoteSave(trackedId) {
    await updateStatus({ trackedId, notes: notes[trackedId] || "" });
    setEditingNotes(null);
    refetchTracked();
    showToast("Note saved");
  }

  async function handleUntrack(trackedId, schemeName) {
    await untrack({ trackedId });
    refetchTracked();
    showToast(`Removed "${schemeName}" from tracker`);
  }

  if (!businessId) {
    return (
      <AppShell>
        <div className="empty-state">
          <ClipboardList size={48} strokeWidth={1.5} className="empty-state-icon" />
          <h2 className="font-semibold text-lg mb-2">No business profile</h2>
          <button className="btn-primary mt-2" onClick={() => navigate("/onboarding")}>Set up profile</button>
        </div>
      </AppShell>
    );
  }

  const isLoading = trackedData === undefined;

  return (
    <AppShell trackedCount={trackedData?.length || 0}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="font-bold mb-1"
              style={{ fontSize: "var(--text-xl)", color: "var(--color-ink)" }}
            >
              Tracked Schemes
            </h1>
            <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
              {isLoading ? "Loading…" : `${trackedData?.length || 0} scheme${trackedData?.length !== 1 ? "s" : ""} being tracked`}
            </p>
          </div>
          <button className="btn-secondary text-sm" onClick={() => navigate("/dashboard")}>
            Find more schemes
          </button>
        </div>

        {/* Empty state */}
        {!isLoading && (!trackedData || trackedData.length === 0) && (
          <div className="empty-state">
            <ClipboardList size={56} strokeWidth={1.25} className="empty-state-icon" />
            <h3 className="font-semibold text-lg mb-2">No schemes tracked yet</h3>
            <p className="mb-4" style={{ color: "var(--color-ink-muted)" }}>
              Track schemes from your matches to monitor deadlines and status.
            </p>
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>View my matches</button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card space-y-3">
                <div className="skeleton h-5 w-1/2 rounded" />
                <div className="flex gap-3">
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop table */}
        {!isLoading && trackedData && trackedData.length > 0 && (
          <>
            <div
              className="hidden lg:block rounded-xl overflow-hidden"
              style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}
            >
              <table className="data-table">
                <thead>
                  <tr style={{ background: "var(--color-surface-alt)" }}>
                    <th>Scheme</th>
                    <th>Category</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {trackedData.map((item) => (
                    <TrackedRow
                      key={item._id}
                      item={item}
                      notes={notes}
                      setNotes={setNotes}
                      editingNotes={editingNotes}
                      setEditingNotes={setEditingNotes}
                      onStatusChange={handleStatusChange}
                      onNoteSave={handleNoteSave}
                      onUntrack={handleUntrack}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="lg:hidden space-y-4">
              {trackedData.map((item) => (
                <TrackedCard
                  key={item._id}
                  item={item}
                  notes={notes}
                  setNotes={setNotes}
                  editingNotes={editingNotes}
                  setEditingNotes={setEditingNotes}
                  onStatusChange={handleStatusChange}
                  onNoteSave={handleNoteSave}
                  onUntrack={handleUntrack}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <ToastContainer />
    </AppShell>
  );
}

// ── Desktop Row ───────────────────────────────────────────────────────────────

function TrackedRow({ item, notes, setNotes, editingNotes, setEditingNotes, onStatusChange, onNoteSave, onUntrack }) {
  const { scheme } = item;
  if (!scheme) return null;
  const deadlineText = formatDeadline(scheme.deadline);
  const deadlineClass = getDeadlineClass(scheme.deadline);
  const catClass = getCategoryClass(scheme.category);

  return (
    <tr id={`tracked-row-${item._id}`}>
      <td>
        <div className="font-medium" style={{ color: "var(--color-ink)" }}>{scheme.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>{scheme.authority}</div>
      </td>
      <td><span className={catClass}>{scheme.category}</span></td>
      <td>
        <div className={`flex items-center gap-1 text-sm ${deadlineClass}`}>
          <Clock size={13} strokeWidth={1.75} />{deadlineText}
        </div>
      </td>
      <td>
        <select
          id={`status-${item._id}`}
          className="form-select text-xs"
          style={{ width: "auto", minWidth: "130px" }}
          value={item.status}
          onChange={(e) => onStatusChange(item._id, e.target.value)}
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </td>
      <td>
        {editingNotes === item._id ? (
          <div className="flex gap-2 items-center">
            <input
              className="form-input text-xs"
              style={{ width: "160px" }}
              value={notes[item._id] ?? item.notes ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [item._id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && onNoteSave(item._id)}
              autoFocus
            />
            <button className="btn-primary text-xs px-2 py-1" onClick={() => onNoteSave(item._id)}>Save</button>
          </div>
        ) : (
          <button
            className="text-xs text-left"
            style={{ color: item.notes ? "var(--color-ink)" : "var(--color-ink-muted)" }}
            onClick={() => { setNotes((n) => ({ ...n, [item._id]: item.notes || "" })); setEditingNotes(item._id); }}
          >
            {item.notes || "Add note…"}
          </button>
        )}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost p-1.5">
            <ExternalLink size={14} strokeWidth={1.75} />
          </a>
          <button
            className="btn-ghost p-1.5"
            style={{ color: "var(--color-danger)" }}
            onClick={() => onUntrack(item._id, scheme.name)}
            title="Remove from tracker"
          >
            <BookmarkX size={14} strokeWidth={1.75} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Mobile Card ───────────────────────────────────────────────────────────────

function TrackedCard({ item, notes, setNotes, editingNotes, setEditingNotes, onStatusChange, onNoteSave, onUntrack }) {
  const { scheme } = item;
  if (!scheme) return null;
  const deadlineText = formatDeadline(scheme.deadline);
  const deadlineClass = getDeadlineClass(scheme.deadline);
  const catClass = getCategoryClass(scheme.category);

  return (
    <div className="card space-y-3" id={`tracked-card-${item._id}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "var(--color-ink)" }}>{scheme.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-ink-muted)" }}>{scheme.authority}</p>
        </div>
        <button
          className="btn-ghost p-1.5 flex-shrink-0"
          style={{ color: "var(--color-danger)" }}
          onClick={() => onUntrack(item._id, scheme.name)}
        >
          <BookmarkX size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className={catClass}>{scheme.category}</span>
        <span className={`flex items-center gap-1 text-xs ${deadlineClass}`}>
          <Clock size={12} strokeWidth={1.75} />{deadlineText}
        </span>
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-ink-muted)" }}>Status</label>
        <select
          id={`status-mobile-${item._id}`}
          className="form-select text-sm"
          value={item.status}
          onChange={(e) => onStatusChange(item._id, e.target.value)}
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: "var(--color-ink-muted)" }}>Notes</label>
        {editingNotes === item._id ? (
          <div className="flex gap-2">
            <input
              className="form-input text-sm flex-1"
              value={notes[item._id] ?? item.notes ?? ""}
              onChange={(e) => setNotes((n) => ({ ...n, [item._id]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && onNoteSave(item._id)}
              autoFocus
            />
            <button className="btn-primary text-xs px-3" onClick={() => onNoteSave(item._id)}>Save</button>
          </div>
        ) : (
          <button
            className="text-sm text-left w-full"
            style={{ color: item.notes ? "var(--color-ink)" : "var(--color-ink-muted)" }}
            onClick={() => { setNotes((n) => ({ ...n, [item._id]: item.notes || "" })); setEditingNotes(item._id); }}
          >
            {item.notes || "Tap to add a note…"}
          </button>
        )}
      </div>

      <a
        href={scheme.applyUrl}
        className="btn-secondary w-full text-sm justify-center"
      >
        <ExternalLink size={14} strokeWidth={1.75} />Apply / View details
      </a>
    </div>
  );
}
