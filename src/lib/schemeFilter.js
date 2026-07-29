/**
 * Rule-based scheme filter (runs BEFORE any Gemini call)
 * Per PRD.md §7: hard-filter by sector/state/turnover/registration,
 * then Gemini only ranks/explains within filtered set.
 */

const TURNOVER_ORDER = ["<40L", "40L-5Cr", "5Cr-50Cr", ">50Cr"];

function turnoverIndex(band) {
  return TURNOVER_ORDER.indexOf(band);
}

/**
 * Hard-filter schemes by business profile rules.
 * Returns schemes the business is potentially eligible for.
 */
export function filterSchemesByRules(business, schemes) {
  return schemes.filter((scheme) => {
    const { eligibility } = scheme;

    // Sector check: "*" means all sectors, otherwise must include business sector
    if (!eligibility.sectors.includes("*")) {
      const sectorMatch = eligibility.sectors.some((s) =>
        s.toLowerCase() === business.sector.toLowerCase() ||
        business.sector.toLowerCase().includes(s.toLowerCase().replace("manufacturing - ", "")) ||
        s.toLowerCase().includes(business.sector.toLowerCase())
      );
      if (!sectorMatch) return false;
    }

    // State check: "*" means all states
    if (!eligibility.states.includes("*")) {
      if (!eligibility.states.includes(business.state)) return false;
    }

    // Turnover check: if maxTurnover set, business must be at or below it
    if (eligibility.maxTurnover) {
      const bizIdx = turnoverIndex(business.turnoverBand);
      const maxIdx = turnoverIndex(eligibility.maxTurnover);
      if (bizIdx > maxIdx) return false;
    }

    // Registration check: if required, business must have it
    if (eligibility.registrationRequired.length > 0) {
      const hasRequired = eligibility.registrationRequired.some(
        (r) => r.toLowerCase() === business.registrationType.toLowerCase()
      );
      if (!hasRequired) return false;
    }

    return true;
  });
}

/**
 * Compute a base match score based on how many eligibility criteria
 * are explicitly met (used as fallback / to seed Gemini scoring).
 */
export function computeBaseScore(business, scheme) {
  let score = 50; // baseline for passing filter
  const { eligibility } = scheme;

  // Sector exact match bonus
  if (!eligibility.sectors.includes("*")) {
    const exactMatch = eligibility.sectors.some(
      (s) => s.toLowerCase() === business.sector.toLowerCase()
    );
    if (exactMatch) score += 20;
    else score += 10; // partial sector match
  } else {
    score += 15; // universal scheme bonus
  }

  // State match bonus
  if (!eligibility.states.includes("*")) {
    score += 20; // state-specific match is valuable
  } else {
    score += 10;
  }

  // Registration bonus
  if (eligibility.registrationRequired.length === 0) {
    score += 5; // no registration required = lower bar, still ok
  } else {
    score += 10; // has the exact required registration
  }

  // Turnover tight match
  if (
    eligibility.maxTurnover &&
    eligibility.maxTurnover === business.turnoverBand
  ) {
    score += 5; // exact band match
  }

  return Math.min(score, 99); // cap at 99, Gemini can push to 100
}
