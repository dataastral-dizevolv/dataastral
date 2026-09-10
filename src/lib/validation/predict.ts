import { z } from "zod";

import {
  CALIBRATION_THEMES,
  GENDER_IDS,
  MAX_LOCATION_LENGTH,
  MAX_PLACE_QUERY_LENGTH,
  MAX_QUESTION_LENGTH,
  MAX_TIMEZONE_LENGTH,
  THEME_IDS,
  isCalendarDate,
  isClockTime,
  normalizeDynamicAnswers,
} from "./fields";

const themeSchema = z.string().trim().toLowerCase().pipe(z.enum(THEME_IDS));

const optionalCoordinate = z
  .union([z.number().finite(), z.null()])
  .optional()
  .transform((value) => (typeof value === "number" ? value : null));

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value ?? "");

const optionalDate = z
  .union([z.string().trim(), z.null()])
  .optional()
  .transform((value) => (typeof value === "string" ? value.trim() : ""))
  .refine((value) => value.length === 0 || isCalendarDate(value));

const genderSchema = z
  .unknown()
  .optional()
  .transform((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    return GENDER_IDS.includes(normalized as (typeof GENDER_IDS)[number]) ? normalized : null;
  });

const dynamicAnswersSchema = z.unknown().optional().transform(normalizeDynamicAnswers);

const predictSharedShape = {
  theme: themeSchema,
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
  birthDate: z.string().trim().refine(isCalendarDate),
  birthTime: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .refine(isClockTime),
  gender: genderSchema,
  birthTimezone: z.string().trim().min(1).max(MAX_TIMEZONE_LENGTH),
  birthLat: optionalCoordinate,
  birthLng: optionalCoordinate,
  placeQuery: optionalTrimmed(MAX_PLACE_QUERY_LENGTH),
  dynamicAnswers: dynamicAnswersSchema,
};

export const predictPublicBodySchema = z.object({
  ...predictSharedShape,
  birthLocation: z.string().trim().min(1).max(MAX_LOCATION_LENGTH),
});

export const predictBodySchema = z.object({
  ...predictSharedShape,
  birthLocation: optionalTrimmed(MAX_LOCATION_LENGTH),
  targetBirthDate: optionalDate,
  targetBirthTime: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (typeof value === "string" ? value.trim() : ""))
    .refine(isClockTime),
  targetBirthTimezone: optionalTrimmed(MAX_TIMEZONE_LENGTH),
  conflictDate: optionalDate,
});

export type PredictPublicBody = z.infer<typeof predictPublicBodySchema>;
export type PredictBody = z.infer<typeof predictBodySchema>;

export { CALIBRATION_THEMES };
