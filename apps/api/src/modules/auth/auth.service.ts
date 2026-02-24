import type {
  AccessTokenResponse,
  AuthMessageResponse,
  AuthSuccessResponse,
  ForgotPasswordInput,
  LoginInput
} from "@crypto/shared";
import {
  forgotPasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  resetPasswordInputSchema
} from "@crypto/shared";
import type { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";

import type { AppEnv } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import { hashPassword, hashToken, timingSafeCompare, verifyPassword } from "../../lib/security.js";
import { sendResetPasswordEmail } from "../../services/email.service.js";
import { userRepository, toAuthUser } from "../user/user.repository.js";
import { issueSessionTokens, verifyToken } from "./auth.tokens.js";

interface AuthResult {
  response: AuthSuccessResponse;
  refreshToken: string;
}

async function createSessionForUser(
  app: FastifyInstance,
  env: AppEnv,
  userId: string
): Promise<AuthResult> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const { accessToken, refreshToken } = await issueSessionTokens(app, env, {
    userId: user._id.toString(),
    email: user.email
  });

  await userRepository.updateRefreshTokenHash(user._id.toString(), hashToken(refreshToken));

  const authUser = toAuthUser(user);
  return {
    response: {
      accessToken,
      user: authUser
    },
    refreshToken
  };
}

export async function registerUser(
  app: FastifyInstance,
  env: AppEnv,
  input: unknown
): Promise<AuthResult> {
  const parsed = registerInputSchema.parse(input);

  const existingUser = await userRepository.findByEmail(parsed.email);
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await hashPassword(parsed.password);
  let user;
  try {
    user = await userRepository.create({
      name: parsed.name,
      email: parsed.email,
      passwordHash
    });
  } catch (error) {
    const duplicateKey = typeof error === "object" && error !== null && "code" in error;
    if (duplicateKey && (error as { code?: number }).code === 11000) {
      throw new AppError("Email already registered", 409);
    }

    throw error;
  }

  return createSessionForUser(app, env, user._id.toString());
}

export async function loginUser(
  app: FastifyInstance,
  env: AppEnv,
  input: unknown
): Promise<AuthResult> {
  const parsed: LoginInput = loginInputSchema.parse(input);
  const user = await userRepository.findByEmail(parsed.email);
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await verifyPassword(parsed.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  return createSessionForUser(app, env, user._id.toString());
}

export async function refreshSession(
  app: FastifyInstance,
  env: AppEnv,
  refreshToken: string
): Promise<{ response: AccessTokenResponse; refreshToken: string }> {
  let payload;
  try {
    payload = await verifyToken(app, refreshToken);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  if (payload.tokenType !== "refresh") {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user?.refreshTokenHash) {
    throw new AppError("Invalid session", 401);
  }

  if (!timingSafeCompare(user.refreshTokenHash, hashToken(refreshToken))) {
    throw new AppError("Invalid session", 401);
  }

  const session = await createSessionForUser(app, env, user._id.toString());
  return {
    response: {
      accessToken: session.response.accessToken
    },
    refreshToken: session.refreshToken
  };
}

export async function logoutUser(userId: string): Promise<void> {
  await userRepository.clearRefreshTokenHash(userId);
}

export async function forgotPassword(env: AppEnv, input: unknown): Promise<AuthMessageResponse> {
  const parsed: ForgotPasswordInput = forgotPasswordInputSchema.parse(input);
  const user = await userRepository.findByEmail(parsed.email);

  if (!user) {
    return {
      message: "If the email exists, we will send reset instructions"
    };
  }

  const resetToken = randomBytes(32).toString("hex");
  const resetTokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await userRepository.setPasswordResetToken(user._id.toString(), resetTokenHash, expiresAt);
  await sendResetPasswordEmail(env, { to: user.email, token: resetToken });

  return {
    message: "If the email exists, we will send reset instructions"
  };
}

export async function resetPassword(input: unknown): Promise<AuthMessageResponse> {
  const parsed = resetPasswordInputSchema.parse(input);
  const resetTokenHash = hashToken(parsed.token);

  const user = await userRepository.findByPasswordResetTokenHash(resetTokenHash);
  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const passwordHash = await hashPassword(parsed.password);
  await userRepository.updatePassword(user._id.toString(), passwordHash);

  return {
    message: "Password reset successfully"
  };
}
