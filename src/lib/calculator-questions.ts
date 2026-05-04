import type { AdminCalculatorQuestionType } from "@/types/admin";
import { isCalculatorCategory, type CalculatorCategory } from "@/lib/calculator-categories";

const QUESTION_TYPES = new Set<AdminCalculatorQuestionType>(["select", "text", "checkbox"]);
const FIELD_NAME_REGEX = /^[a-z][a-z0-9_]{1,62}$/;

const RESERVED_FIELD_NAMES = new Set([
  "theme",
  "question",
  "birth_date",
  "birth_time",
  "birth_timezone",
  "birth_location",
  "birth_lat",
  "birth_lng",
  "place_query",
  "target_birth_date",
  "target_birth_time",
  "target_birth_timezone",
  "conflict_date",
  "transit_planet",
  "natal_planet",
  "aspect",
  "aspect_angle",
  "dynamic_answers",
  "year",
  "month",
]);

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function ensureFieldNameLength(value: string) {
  return value.slice(0, 63);
}

function applyNumericSuffix(base: string, suffixNumber: number) {
  const suffix = `_${suffixNumber}`;
  const maxBaseLength = Math.max(1, 63 - suffix.length);
  return `${base.slice(0, maxBaseLength)}${suffix}`;
}

export interface RawQuestionOption {
  value?: unknown;
  label?: unknown;
}

export interface CalculatorQuestionRow {
  id: number;
  category: CalculatorCategory;
  label: string;
  field_name: string;
  type: AdminCalculatorQuestionType;
  options: unknown;
  order: number;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function normalizeQuestionType(value: unknown): AdminCalculatorQuestionType | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim() as AdminCalculatorQuestionType;
  return QUESTION_TYPES.has(normalized) ? normalized : null;
}

export function normalizeFieldName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (!FIELD_NAME_REGEX.test(normalized)) {
    return null;
  }

  if (RESERVED_FIELD_NAMES.has(normalized)) {
    return null;
  }

  return normalized;
}

export function slugifyQuestionLabelToFieldName(label: string) {
  const noAccents = stripDiacritics(label.trim().toLowerCase());
  const snakeCase = noAccents
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  let candidate = snakeCase;

  if (!candidate) {
    candidate = "pergunta";
  }

  if (!/^[a-z]/.test(candidate)) {
    candidate = `pergunta_${candidate}`;
  }

  candidate = ensureFieldNameLength(candidate);

  if (RESERVED_FIELD_NAMES.has(candidate)) {
    candidate = ensureFieldNameLength(`${candidate}_item`);
  }

  if (!/^[a-z][a-z0-9_]{1,62}$/.test(candidate)) {
    candidate = "pergunta_item";
  }

  return candidate;
}

export function buildUniqueFieldName(baseFieldName: string, usedFieldNames: string[]) {
  const used = new Set(usedFieldNames);
  const base = slugifyQuestionLabelToFieldName(baseFieldName);

  if (!used.has(base)) {
    return base;
  }

  for (let suffix = 1; suffix <= 10000; suffix += 1) {
    const candidate = applyNumericSuffix(base, suffix);
    if (!used.has(candidate) && normalizeFieldName(candidate)) {
      return candidate;
    }
  }

  return applyNumericSuffix(base, Date.now() % 100000);
}

export function normalizeCategory(value: unknown): CalculatorCategory | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return isCalculatorCategory(normalized) ? normalized : null;
}

export function normalizeQuestionOptions(value: unknown): Array<{ value: string; label: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        const normalized = item.trim();
        if (!normalized) return null;
        return { value: normalized, label: normalized };
      }

      if (item && typeof item === "object") {
        const typed = item as RawQuestionOption;
        const rawValue = typeof typed.value === "string" ? typed.value.trim() : "";
        const rawLabel = typeof typed.label === "string" ? typed.label.trim() : "";
        const finalValue = rawValue || rawLabel;
        const finalLabel = rawLabel || rawValue;

        if (!finalValue || !finalLabel) {
          return null;
        }

        return { value: finalValue, label: finalLabel };
      }

      return null;
    })
    .filter((item): item is { value: string; label: string } => Boolean(item));
}

export function mapQuestionRow(row: CalculatorQuestionRow) {
  const category = isCalculatorCategory(row.category) ? row.category : "amor";

  return {
    id: row.id,
    category,
    label: row.label,
    fieldName: row.field_name,
    type: row.type,
    options: normalizeQuestionOptions(row.options),
    order: row.order,
    isRequired: row.is_required,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}
