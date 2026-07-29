import { Sparkles } from "lucide-react";

/**
 * AI Callout — the one consistent visual signal for "this came from AI"
 * Always used to wrap Gemini-generated reasoning text per DESIGN.md §3.3
 *
 * Fix #4: tighter icon-to-text gap, stronger left border accent to
 * reinforce "distinct AI-generated insight" per DESIGN.md §3.3
 */
export default function AICallout({ text, className = "" }) {
  return (
    <div
      className={`ai-callout ${className}`}
      style={{
        gap: "8px",                              /* tighter icon-text gap (#4) */
        borderLeft: "3px solid var(--color-accent)", /* left border accent (#4) */
        borderRadius: "0 6px 6px 0",            /* only round right corners */
        padding: "10px 12px",
      }}
    >
      <div
        className="flex-shrink-0 mt-0.5"
        style={{ color: "var(--color-accent)" }}
      >
        <Sparkles size={13} strokeWidth={1.75} />
      </div>
      <p className="leading-relaxed text-sm">{text}</p>
    </div>
  );
}
