import { z } from "zod";

import { authUserSchema } from "./user.js";

export const loginInputSchema = z.object({
  email: z.email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters")
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z.object({
  name: z.string().min(2, "Minimum 2 characters").max(100, "Maximum 100 characters"),
  email: z.email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters")
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

export const forgotPasswordInputSchema = z.object({
  email: z.email("Invalid email")
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Minimum 8 characters")
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export const authMessageResponseSchema = z.object({
  message: z.string()
});

export type AuthMessageResponse = z.infer<typeof authMessageResponseSchema>;
