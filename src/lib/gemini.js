/**
 * Gemini AI integration for MSME Compass
 * - Document OCR extraction (Gemini Vision)
 * - Eligibility reasoning (Gemini Text) — BATCHED: all schemes in 1 API call
 *
 * Uses exact prompts from PRD.md §7.
 * Falls back to realistic mock responses if API key is missing or quota exceeded.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Using generic alias since specific 2.x and 1.5 versions are restricted on this key
const MODEL_VISION = "gemini-flash-latest";
const MODEL_TEXT   = "gemini-flash-latest";

let genAI = null;
if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

// ── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry(fn, retries = 3, baseDelayMs = 8000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.message?.includes("429") || err?.status === 429;
      if (is429 && attempt < retries) {
        // Respect retry-after from error body if present, otherwise exponential backoff
        const retryAfterMatch = err?.message?.match(/retryDelay":"(\d+)s/);
        const retryAfterSec = retryAfterMatch ? parseInt(retryAfterMatch[1]) + 2 : 0;
        const delay = retryAfterSec * 1000 || baseDelayMs * Math.pow(2, attempt);
        console.warn(`[Gemini] 429 rate limit — retrying in ${delay / 1000}s (attempt ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ── Document OCR Extraction ──────────────────────────────────────────────────

/**
 * Extracts business profile from an uploaded document using Gemini Vision.
 * Uses verbatim prompt from PRD.md §7.
 */
export async function extractFromDocument(file) {
  const base64 = await fileToBase64(file);
  const mimeType = file.type || "image/jpeg";

  console.log(`[Gemini OCR] Sending file to Gemini...`);
  console.log(`[Gemini OCR] Target MIME Type: ${mimeType}`);
  console.log(`[Gemini OCR] Base64 length: ${base64.length} chars`);

  if (!genAI) {
    console.warn("[Gemini] No API key — returning mock extraction");
    return getMockExtraction();
  }

  try {
    // gemini-2.0-flash handles complex PDFs much better than -lite
    const model = genAI.getGenerativeModel({ 
      model: MODEL_VISION,
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Analyze the attached Indian MSME registration document (which could be a PDF or image, such as an Udyam or GST certificate). Read all text and extract the following structured business data.

CRITICAL INSTRUCTION: You must return ONLY a raw JSON object. Do not wrap it in markdown backticks (no \`\`\`json). Do not add any preamble or explanation.

Schema to follow:
{
  "businessName": string,
  "sector": string,
  "state": string,
  "registrationType": "Udyam" | "GST" | "Unknown",
  "turnoverBand": "<40L" | "40L-5Cr" | "5Cr-50Cr" | ">50Cr" | "Unknown",
  "registrationNumber": string
}

If a specific field cannot be determined from the document, use "Unknown". Extract the data precisely based on the document's contents.`;

    const result = await withRetry(() =>
      model.generateContent([
        prompt,
        { inlineData: { data: base64, mimeType } },
      ])
    );

    const text = result.response.text().trim();
    console.log("[Gemini] Raw OCR Response:", text); // Debug log

    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("[Gemini] OCR extraction failed. Error:", err);
    throw new Error(`OCR failed: ${err.message || "Unknown error"}`);
  }
}

// ── Eligibility Reasoning — BATCHED ──────────────────────────────────────────

/**
 * Generates eligibility reasoning for all pre-filtered schemes in ONE API call.
 * IMPORTANT: Only ever called on rule-filtered shortlist (never raw scheme list).
 *
 * Returns: [{ schemeId, matchScore, reason }]
 */
export async function generateEligibilityReasons(business, filteredSchemes) {
  if (!genAI) {
    console.warn("[Gemini] No API key — returning mock reasoning");
    return getMockReasonings(filteredSchemes);
  }

  const model = genAI.getGenerativeModel({ model: MODEL_TEXT });

  // Build a compact scheme list — only the fields Gemini needs for reasoning
  const schemeList = filteredSchemes.map((s, i) => ({
    idx: i,
    id: s._id,
    name: s.name,
    authority: s.authority,
    eligibility: s.eligibility,
    benefit: s.benefit,
    category: s.category,
  }));

  // Single batched prompt — 1 API call for ALL schemes
  const prompt = `You are an expert on Indian government MSME schemes.

Business profile:
${JSON.stringify({
  name: business.name,
  sector: business.sector,
  state: business.state,
  registrationType: business.registrationType,
  turnoverBand: business.turnoverBand,
  employeeCount: business.employeeCount,
}, null, 0)}

Schemes to evaluate (${filteredSchemes.length} schemes):
${JSON.stringify(schemeList, null, 0)}

For each scheme, in 1-2 plain sentences (no jargon), explain why this business qualifies and give a matchScore 0-100.

Return ONLY a valid JSON array — no markdown, no extra text:
[{ "idx": number, "reason": string, "matchScore": number }, ...]

All ${filteredSchemes.length} items must be present in the response.`;

  try {
    const result = await withRetry(() => model.generateContent(prompt));
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // Map back from idx to schemeId
    return parsed.map((item) => {
      const scheme = filteredSchemes[item.idx] || filteredSchemes[0];
      return {
        schemeId: scheme._id,
        matchScore: Math.min(100, Math.max(0, item.matchScore || 70)),
        reason: item.reason || `${business.name} meets the core eligibility criteria for ${scheme.name}.`,
      };
    });
  } catch (err) {
    console.error("[Gemini] Batched reasoning failed:", err);
    // Fall back to mock — app stays functional
    return getMockReasonings(filteredSchemes);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMockExtraction() {
  return {
    businessName: "Ravi Textiles Pvt. Ltd.",
    sector: "Manufacturing - Textiles",
    state: "Maharashtra",
    registrationType: "Udyam",
    turnoverBand: "40L-5Cr",
    registrationNumber: "UDYAM-MH-12-0034567",
  };
}

function getMockReasonings(schemes) {
  const mockReasons = [
    "Your Udyam-registered manufacturing business qualifies under the sector and turnover criteria — strong match for the collateral-free credit guarantee.",
    "Your turnover band and sector profile directly align with this scheme's target MSME definition.",
    "As an Udyam-registered manufacturer, you meet all primary eligibility requirements for this certification scheme.",
    "Your business size and registration type make you a strong candidate — the subsidy applies to your category.",
    "Your sector and turnover are within the scheme's eligibility range; approval rates are high for similar businesses.",
    "Your state and registration type qualify you for this state-specific benefit with high match confidence.",
    "Your MSME classification and sector make you eligible for this government procurement preference.",
    "As a Udyam-registered entity you automatically qualify for this scheme with a standard enrollment process.",
  ];

  return schemes.map((scheme, i) => ({
    schemeId: scheme._id,
    matchScore: Math.max(55, 95 - i * 5),
    reason: mockReasons[i % mockReasons.length],
  }));
}
