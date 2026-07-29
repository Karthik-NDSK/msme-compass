/**
 * Application-wide constants and helper utilities
 */

export const SECTORS = [
  "Manufacturing - Textiles",
  "Manufacturing - Auto Components",
  "Manufacturing - Electronics",
  "Manufacturing - Food Processing",
  "Manufacturing - General",
  "Manufacturing - Pharmaceuticals",
  "Technology / IT Services",
  "Handicrafts",
  "Khadi",
  "Food & Beverages",
  "Agro-based Industries",
  "Construction",
  "Retail / Trading",
  "Healthcare Services",
  "Education & Training",
  "Logistics / Transport",
  "Other Services",
];

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Jammu & Kashmir", "Ladakh",
];

export const TURNOVER_BANDS = [
  { value: "<40L", label: "Under ₹40 Lakh" },
  { value: "40L-5Cr", label: "₹40L – ₹5 Crore" },
  { value: "5Cr-50Cr", label: "₹5 Cr – ₹50 Crore" },
  { value: ">50Cr", label: "Above ₹50 Crore" },
];

export const REGISTRATION_TYPES = [
  { value: "Udyam", label: "Udyam" },
  { value: "GST", label: "GST Only" },
  { value: "None", label: "None" },
];

export const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "applied", label: "Applied" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const CATEGORIES = ["Subsidy", "Certification", "Funding", "Tax Benefit"];

// ── Date helpers ─────────────────────────────────────────────────────────────

export function formatDeadline(timestamp) {
  if (!timestamp) return "Rolling";
  const now = Date.now();
  const diff = timestamp - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "1 day left";
  if (days <= 30) return `${days} days left`;

  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getDeadlineClass(timestamp) {
  if (!timestamp) return "deadline-rolling";
  const now = Date.now();
  const diff = timestamp - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "deadline-danger";
  if (days <= 14) return "deadline-warning";
  return "deadline-normal";
}

export function getMatchBadgeClass(score) {
  if (score >= 80) return "match-badge match-badge-high";
  if (score >= 50) return "match-badge match-badge-mid";
  return "match-badge match-badge-low";
}

export function getCategoryClass(category) {
  switch (category) {
    case "Subsidy": return "category-chip category-subsidy";
    case "Certification": return "category-chip category-certification";
    case "Funding": return "category-chip category-funding";
    case "Tax Benefit": return "category-chip category-tax";
    default: return "category-chip category-subsidy";
  }
}

export function getStatusClass(status) {
  switch (status) {
    case "not_started": return "status-not-started";
    case "in_progress": return "status-in-progress";
    case "applied": return "status-applied";
    case "approved": return "status-approved";
    case "rejected": return "status-rejected";
    default: return "status-not-started";
  }
}

export function getStatusLabel(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || "Not Started";
}

// ── Local storage auth (simple hackathon auth) ───────────────────────────────

const USER_KEY = "msme_compass_user";

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function generateUserId() {
  return "user_" + Math.random().toString(36).substr(2, 9);
}

// ── Business storage ─────────────────────────────────────────────────────────

const BIZ_KEY = "msme_compass_business";

export function getStoredBusiness() {
  try {
    const raw = localStorage.getItem(BIZ_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredBusiness(biz) {
  localStorage.setItem(BIZ_KEY, JSON.stringify(biz));
}
