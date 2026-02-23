import { z } from "zod";

export const preferredCurrencySchema = z.enum(["USD", "EUR", "BRL", "GBP"]);

export const userProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  email: z.email(),
  description: z.string().max(500).optional(),
  hasAvatar: z.boolean().default(false),
  preferredCurrency: preferredCurrencySchema.default("USD"),
  favorites: z.array(z.string()).max(50),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  email: z.email()
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const updateUserProfileInputSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.email().optional(),
  description: z.string().max(500).optional(),
  preferredCurrency: preferredCurrencySchema.optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

export const avatarUpdateResponseSchema = z.object({
  message: z.string()
});

export type AvatarUpdateResponse = z.infer<typeof avatarUpdateResponseSchema>;
