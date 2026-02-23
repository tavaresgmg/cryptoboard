import type {
  AccessTokenResponse,
  AuthSuccessResponse,
  LoginInput
} from "@crypto/shared";
import { loginInputSchema, registerInputSchema } from "@crypto/shared";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import { hashPassword, hashToken, verifyPassword } from "../../lib/security.js";
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
