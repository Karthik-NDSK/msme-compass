import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, ChevronRight, AlertCircle } from "lucide-react";
import { extractFromDocument } from "../lib/gemini";
import { SkeletonForm } from "../components/ui/Skeleton";
import { useCreateBusiness, useSeedSchemes } from "../lib/backend";
import {
  SECTORS,
  STATES,
  TURNOVER_BANDS,
  REGISTRATION_TYPES,
  getUser,
  setStoredBusiness,
} from "../lib/utils";

const REQUIRED = ["name", "sector", "state", "registrationType", "turnoverBand"];

export default function Onboarding() {
  const navigate = useNavigate();
  const createBusiness = useCreateBusiness();

  const seedSchemes = useSeedSchemes();

  const [tab, setTab] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sector: "",
    state: "",
    registrationType: "",
    turnoverBand: "",
    employeeCount: "",
    registrationNumber: "",
  });

  const isFormValid = REQUIRED.every((f) => form[f]?.trim());

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFile(f) {
    if (!f) return;
    if (!f.type.match(/image\/(jpeg|png|webp)|application\/pdf/)) {
      setExtractError("Please upload a JPG, PNG, WEBP, or PDF file.");
      return;
    }
    setFile(f);
    setExtractError(null);
    runExtraction(f);
  }

  async function runExtraction(f) {
    setExtracting(true);
    setExtractError(null);
    try {
      const result = await extractFromDocument(f);
      setForm({
        name: result.businessName !== "Unknown" ? result.businessName : "",
        sector: SECTORS.includes(result.sector) ? result.sector : "",
        state: STATES.includes(result.state) ? result.state : "",
        registrationType:
          REGISTRATION_TYPES.map((r) => r.value).includes(result.registrationType)
            ? result.registrationType
            : "",
        turnoverBand:
          TURNOVER_BANDS.map((b) => b.value).includes(result.turnoverBand)
            ? result.turnoverBand
            : "",
        employeeCount: "",
        registrationNumber: result.registrationNumber !== "Unknown" ? result.registrationNumber : "",
      });
    } catch (err) {
      setExtractError("Couldn't read the document. Please fill in details manually.");
      console.error(err);
    } finally {
      setExtracting(false);
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isFormValid) return;
    setSubmitting(true);

    try {
      // Ensure schemes are seeded
      await seedSchemes();

      const user = getUser();
      const businessId = await createBusiness({
        userId: user.id,
        name: form.name.trim(),
        sector: form.sector,
        state: form.state,
        registrationType: form.registrationType,
        turnoverBand: form.turnoverBand,
        employeeCount: parseInt(form.employeeCount) || 0,
        extractedFrom: file ? "ocr" : "manual",
        registrationNumber: form.registrationNumber.trim() || undefined,
      });

      setStoredBusiness({
        id: businessId,
        name: form.name.trim(),
        sector: form.sector,
        state: form.state,
        registrationType: form.registrationType,
        turnoverBand: form.turnoverBand,
      });

      navigate("/dashboard", { state: { businessId, isNew: true } });
    } catch (err) {
      console.error("Failed to save business:", err);
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-start justify-center px-5 py-10"
      style={{ background: "var(--color-surface-alt)" }}
    >
      <div className="w-full" style={{ maxWidth: "560px" }}>
        <div className="mb-8">
          <h1
            className="font-bold mb-2"
            style={{ fontSize: "var(--text-2xl)", color: "var(--color-ink)" }}
          >
            Set up your business profile
          </h1>
          <p style={{ color: "var(--color-ink-muted)" }}>
            We'll use this to find the schemes you qualify for.
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="flex rounded-lg p-1 mb-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {[
            { id: "upload", label: "Upload document" },
            { id: "manual", label: "Enter manually" },
          ].map(({ id, label }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                background: tab === id ? "var(--color-primary)" : "transparent",
                color: tab === id ? "white" : "var(--color-ink-muted)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="rounded-xl p-6 sm:p-8"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Upload tab */}
          {tab === "upload" && !extracting && !file && (
            <div
              id="upload-zone"
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById("file-input").click()}
            >
              <Upload size={40} strokeWidth={1.5} className="mb-3" />
              <p className="font-semibold text-sm mb-1">Drop your Udyam or GST certificate</p>
              <p className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
                JPG, PNG, WEBP or PDF · AI will extract details automatically
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* File selected indicator */}
          {file && !extracting && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg mb-4"
              style={{ background: "var(--color-primary-light)", border: "1px solid var(--color-primary)" }}
            >
              <FileText size={18} strokeWidth={1.75} color="var(--color-primary)" />
              <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--color-primary-dark)" }}>
                {file.name}
              </span>
              <button
                onClick={() => {
                  setFile(null);
                  setForm({ name: "", sector: "", state: "", registrationType: "", turnoverBand: "", employeeCount: "", registrationNumber: "" });
                }}
              >
                <X size={16} color="var(--color-ink-muted)" />
              </button>
            </div>
          )}

          {/* Skeleton loading */}
          {extracting && <SkeletonForm />}

          {/* Error */}
          {extractError && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg mb-4 text-sm"
              style={{ background: "#FEE2E2", color: "var(--color-danger)" }}
            >
              <AlertCircle size={16} strokeWidth={1.75} className="mt-0.5 flex-shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          {/* Form */}
          {!extracting && (tab === "manual" || file || extractError) && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {(file || extractError) && (
                <div
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: "var(--color-accent-light)", color: "var(--color-accent)" }}
                >
                  ✓ Fields extracted — review and edit before submitting
                </div>
              )}

              <div>
                <label htmlFor="biz-name" className="form-label">
                  Business Name <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  id="biz-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sharma Textiles Pvt. Ltd."
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sector" className="form-label">
                    Sector <span style={{ color: "var(--color-danger)" }}>*</span>
                  </label>
                  <select
                    id="sector"
                    className="form-select"
                    value={form.sector}
                    onChange={(e) => updateField("sector", e.target.value)}
                    required
                  >
                    <option value="">Select sector</option>
                    {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="state" className="form-label">
                    State <span style={{ color: "var(--color-danger)" }}>*</span>
                  </label>
                  <select
                    id="state"
                    className="form-select"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    required
                  >
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">
                  Registration Type <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {REGISTRATION_TYPES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      id={`reg-${value}`}
                      onClick={() => updateField("registrationType", value)}
                      className={`chip ${form.registrationType === value ? "chip-selected" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">
                  Annual Turnover <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {TURNOVER_BANDS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      id={`turnover-${value}`}
                      onClick={() => updateField("turnoverBand", value)}
                      className={`chip ${form.turnoverBand === value ? "chip-selected" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emp-count" className="form-label">Employee Count</label>
                  <input
                    id="emp-count"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 25"
                    min="0"
                    value={form.employeeCount}
                    onChange={(e) => updateField("employeeCount", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="reg-number" className="form-label">Registration Number</label>
                  <input
                    id="reg-number"
                    type="text"
                    className="form-input"
                    placeholder="e.g. UDYAM-MH-12-0034567"
                    value={form.registrationNumber}
                    onChange={(e) => updateField("registrationNumber", e.target.value)}
                  />
                </div>
              </div>

              <button
                id="find-schemes-btn"
                type="submit"
                disabled={!isFormValid || submitting}
                className="btn-primary w-full py-3 text-base mt-2"
              >
                {submitting ? "Saving…" : (
                  <>
                    Find my schemes
                    <ChevronRight size={18} strokeWidth={1.75} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
