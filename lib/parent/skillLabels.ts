import type { SkillTag } from "@/lib/types";

/**
 * Static SkillTag → Hebrew display-label map for the Parent Dashboard.
 *
 * This is a plain constant, NOT a persisted schema — it never touches
 * localStorage and never auto-escalates to MAX. Skill tags are a Math-native
 * taxonomy (English / Science exercises currently author empty `meta.skillTags`),
 * so the weak-skill ranking surfaces Math skills only. Covering all 24 known
 * tags keeps the labels exhaustive; `getSkillLabel` falls back gracefully if a
 * future tag is added before this map is updated.
 */
export const SKILL_LABELS: Record<SkillTag, string> = {
  counting: "ספירה",
  "number-recognition": "זיהוי מספרים",
  "number-line": "ציר המספרים",
  addition: "חיבור",
  subtraction: "חיסור",
  comparing: "השוואת מספרים",
  "word-problems": "בעיות מילוליות",
  "geometry-shapes": "צורות הנדסיות",
  patterns: "תבניות וסדרות",
  "place-value": "ערך המקום",
  "measurement-length": "מדידת אורך",
  "measurement-time": "מדידת זמן",
  "symmetry-transform": "סימטריה",
  "gematria-letters": "גימטריה",
  "multiplication-intro": "מבוא לכפל",
  "multiplication-tables": "לוח הכפל",
  "number-bonds": "פירוק וצירוף מספרים",
  "division-equal-groups": "חילוק לקבוצות שוות",
  "fractions-parts": "שברים וחלקים",
  "measurement-area": "מדידת שטח",
  "measurement-weight": "מדידת משקל",
  "geometry-solids": "גופים הנדסיים",
  "money-shekel": "כסף ושקלים",
};

/** Hebrew label for a skill tag; falls back to the raw tag if unmapped. */
export function getSkillLabel(tag: SkillTag): string {
  return SKILL_LABELS[tag] ?? tag;
}
