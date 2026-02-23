import { z } from "zod";

import { authUserSchema } from "./user.js";

export const loginInputSchema = z.object({
  email: z.email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres")
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres").max(100, "Maximo 100 caracteres"),
  email: z.email("Email invalido"),
  password: z.string().min(8, "Minimo 8 caracteres")
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const accessTokenResponseSchema = z.object({
  accessToken: z.string()
});

export type AccessTokenResponse = z.infer<typeof accessTokenResponseSchema>;

export const authSuccessResponseSchema = accessTokenResponseSchema.extend({
  user: authUserSchema
});

export type AuthSuccessResponse = z.infer<typeof authSuccessResponseSchema>;

export const logoutResponseSchema = z.object({
  message: z.string()
});

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
