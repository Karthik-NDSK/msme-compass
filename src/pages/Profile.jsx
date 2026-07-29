import { useNavigate } from "react-router-dom";
import { Building2, Edit, MapPin, DollarSign, Users } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { useBusinessGet, useTrackedByBusiness } from "../lib/backend";
import { getStoredBusiness, TURNOVER_BANDS } from "../lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const storedBusiness = getStoredBusiness();
  const businessId = storedBusiness?.id;

  const business = useBusinessGet(businessId);
  const [trackedData] = useTrackedByBusiness(businessId);

  const turnoverLabel = TURNOVER_BANDS.find((b) => b.value === business?.turnoverBand)?.label || business?.turnoverBand;

  return (
    <AppShell trackedCount={trackedData?.length || 0}>
      <div className="space-y-6" style={{ maxWidth: "640px" }}>
        <div className="flex items-start justify-between">
          <h1
            className="font-bold"
            style={{ fontSize: "var(--text-xl)", color: "var(--color-ink)" }}
          >
            Business Profile
          </h1>
          <button className="btn-secondary text-sm" onClick={() => navigate("/onboarding", { state: { edit: true, business } })}>
            <Edit size={14} strokeWidth={1.75} />
            Update profile
          </button>
        </div>

        {!business && (
          <div className="empty-state">
            <Building2 size={48} strokeWidth={1.5} className="empty-state-icon" />
            <h3 className="font-semibold text-lg mb-2">No profile set up</h3>
            <button className="btn-primary mt-2" onClick={() => navigate("/onboarding")}>
              Set up profile
            </button>
          </div>
        )}

        {business && (
          <div className="card space-y-5">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                style={{ background: "var(--color-primary)" }}
              >
                {business.name[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-lg" style={{ color: "var(--color-ink)" }}>
                  {business.name}
                </h2>
                <p className="text-sm" style={{ color: "var(--color-ink-muted)" }}>
                  Profile created via {business.extractedFrom === "ocr" ? "document upload" : "manual entry"}
                </p>
              </div>
            </div>

            <hr style={{ borderColor: "var(--color-border)" }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Building2, label: "Sector", value: business.sector },
                { icon: MapPin, label: "State", value: business.state },
                { icon: DollarSign, label: "Annual Turnover", value: turnoverLabel },
                { icon: Users, label: "Employees", value: business.employeeCount || "Not specified" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label}>
                  <div className="text-xs font-medium mb-1 flex items-center gap-1.5" style={{ color: "var(--color-ink-muted)" }}>
                    <Icon size={12} strokeWidth={1.75} />{label}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>{value}</div>
                </div>
              ))}
            </div>

            <div
              className="flex items-center gap-3 px-4 py-3 rounded-lg"
              style={{ background: "var(--color-primary-light)" }}
            >
              <div
                className="text-xs font-bold px-2 py-1 rounded-md"
                style={{ background: "var(--color-primary)", color: "white" }}
              >
                {business.registrationType}
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-primary-dark)" }}>
                  {business.registrationType} Registered
                </div>
                {business.registrationNumber && (
                  <div className="text-xs font-mono" style={{ color: "var(--color-ink-muted)" }}>
                    {business.registrationNumber}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {trackedData && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Tracked", value: trackedData.length },
              { label: "Applied", value: trackedData.filter((t) => t.status === "applied").length },
              { label: "Approved", value: trackedData.filter((t) => t.status === "approved").length },
            ].map(({ label, value }) => (
              <div key={label} className="card text-center" style={{ padding: "var(--space-4)" }}>
                <div
                  className="font-bold mb-1"
                  style={{ fontSize: "var(--text-xl)", color: "var(--color-primary)", fontVariantNumeric: "tabular-nums" }}
                >
                  {value}
                </div>
                <div className="text-xs" style={{ color: "var(--color-ink-muted)" }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
