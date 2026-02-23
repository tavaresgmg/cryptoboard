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
import { hashPassword, hashToken, verifyPassword } from "../../lib/security.js";
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
    throw new AppError("Usuario nao encontrado", 404);
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
    throw new AppError("Email ja cadastrado", 409);
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
      throw new AppError("Email ja cadastrado", 409);
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
    throw new AppError("Credenciais invalidas", 401);
  }

  const isPasswordValid = await verifyPassword(parsed.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Credenciais invalidas", 401);
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
    throw new AppError("Refresh token invalido ou expirado", 401);
  }

  if (payload.tokenType !== "refresh") {
    throw new AppError("Refresh token invalido", 401);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user?.refreshTokenHash) {
    throw new AppError("Sessao invalida", 401);
  }

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new AppError("Sessao invalida", 401);
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

export async function forgotPassword(
  env: AppEnv,
  input: unknown
): Promise<AuthMessageResponse> {
  const parsed: ForgotPasswordInput = forgotPasswordInputSchema.parse(input);
  const user = await userRepository.findByEmail(parsed.email);

  // Sempre devolve mensagem generica para evitar enumeracao de usuarios.
  if (!user) {
    return {
      message: "Se o email existir, enviaremos instrucoes de redefinicao"
    };
  }

  const resetToken = randomBytes(32).toString("hex");
  const resetTokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await userRepository.setPasswordResetToken(user._id.toString(), resetTokenHash, expiresAt);
  await sendResetPasswordEmail(env, { to: user.email, token: resetToken });

  return {
    message: "Se o email existir, enviaremos instrucoes de redefinicao"
  };
}

export async function resetPassword(input: unknown): Promise<AuthMessageResponse> {
  const parsed = resetPasswordInputSchema.parse(input);
  const resetTokenHash = hashToken(parsed.token);

  const user = await userRepository.findByPasswordResetTokenHash(resetTokenHash);
  if (!user) {
    throw new AppError("Token de redefinicao invalido ou expirado", 400);
  }

  const passwordHash = await hashPassword(parsed.password);
  await userRepository.updatePassword(user._id.toString(), passwordHash);

  return {
    message: "Senha redefinida com sucesso"
  };
}
