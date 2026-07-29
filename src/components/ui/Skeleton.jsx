/**
 * Skeleton shimmer loading states for the OCR form
 * Per DESIGN.md §6: show field labels with shimmering placeholders,
 * not a bare spinner
 */
export function SkeletonField({ label }) {
  return (
    <div>
      <div
        className="text-sm font-medium mb-1.5"
        style={{ color: "var(--color-ink)" }}
      >
        {label}
      </div>
      <div className="skeleton h-10 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-5">
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
        style={{
          background: "var(--color-accent-light)",
          color: "var(--color-accent)",
        }}
      >
        <div className="skeleton h-4 w-4 rounded-full" />
        <span className="font-medium">Reading your document...</span>
      </div>
      <SkeletonField label="Business Name" />
      <div className="grid grid-cols-2 gap-4">
        <SkeletonField label="Sector" />
        <SkeletonField label="State" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SkeletonField label="Registration Type" />
        <SkeletonField label="Turnover Band" />
      </div>
      <SkeletonField label="Registration Number" />
    </div>
  );
}
