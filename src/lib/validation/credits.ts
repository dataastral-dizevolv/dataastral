import { z } from "zod";

import { MAX_PACKAGE_ID_LENGTH, UUID_RE } from "./fields";

export const buyCreditsBodySchema = z.object({
  packageId: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9][a-z0-9_-]{0,63}$/)
    .max(MAX_PACKAGE_ID_LENGTH),
  uiMode: z.enum(["embedded", "hosted"]).optional(),
});

export const adminAddCreditsBodySchema = z.object({
  userId: z.string().trim().regex(UUID_RE),
  amount: z.coerce.number().finite().gt(0).lte(1000),
});

export const adminDeactivateBodySchema = z.object({
  userId: z.string().trim().regex(UUID_RE),
});

export type BuyCreditsBody = z.infer<typeof buyCreditsBodySchema>;
export type AdminAddCreditsBody = z.infer<typeof adminAddCreditsBodySchema>;
export type AdminDeactivateBody = z.infer<typeof adminDeactivateBodySchema>;
