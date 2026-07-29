import { getMatchBadgeClass } from "../../lib/utils";

/**
 * Match Score Badge
 * Always shows both color AND text (accessibility per DESIGN.md §7)
 * Uses --color-match-high/mid/low per DESIGN.md §1
 */
export default function MatchBadge({ score }) {
  const className = getMatchBadgeClass(score);

  return (
    <span className={className} aria-label={`${score}% match`}>
      {score}% match
    </span>
  );
}
