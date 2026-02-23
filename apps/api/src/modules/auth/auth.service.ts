import { randomUUID } from "node:crypto";

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

function buildAuthSuccessResponse(accessToken: string, userId: string): AuthSuccessResponse {
  const user = userRepository.findById(userId);
  if (!user) {
    throw new AppError("Usuario nao encontrado", 404);
  }

  return {
    accessToken,
    user: toAuthUser(user)
  };
}

async function createSessionForUser(
  app: FastifyInstance,
  env: AppEnv,
  userId: string
): Promise<AuthResult> {
  const user = userRepository.findById(userId);
  if (!user) {
    throw new AppError("Usuario nao encontrado", 404);
  }

  const { accessToken, refreshToken } = await issueSessionTokens(app, env, {
    userId: user.id,
    email: user.email
  });

  userRepository.updateRefreshTokenHash(user.id, hashToken(refreshToken));

  return {
    response: buildAuthSuccessResponse(accessToken, user.id),
    refreshToken
  };
}

export async function registerUser(
  app: FastifyInstance,
  env: AppEnv,
  input: unknown
): Promise<AuthResult> {
  const parsed = registerInputSchema.parse(input);

  if (userRepository.findByEmail(parsed.email)) {
    throw new AppError("Email ja cadastrado", 409);
  }

  const passwordHash = await hashPassword(parsed.password);
  const user = userRepository.create({
    id: randomUUID(),
    name: parsed.name,
    email: parsed.email,
    passwordHash
  });

  return createSessionForUser(app, env, user.id);
}

export async function loginUser(
  app: FastifyInstance,
  env: AppEnv,
  input: unknown
): Promise<AuthResult> {
  const parsed: LoginInput = loginInputSchema.parse(input);
  const user = userRepository.findByEmail(parsed.email);
  if (!user) {
    throw new AppError("Credenciais invalidas", 401);
  }

  const isPasswordValid = await verifyPassword(parsed.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError("Credenciais invalidas", 401);
  }

  return createSessionForUser(app, env, user.id);
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

  const user = userRepository.findById(payload.sub);
  if (!user?.refreshTokenHash) {
    throw new AppError("Sessao invalida", 401);
  }

  if (user.refreshTokenHash !== hashToken(refreshToken)) {
    throw new AppError("Sessao invalida", 401);
  }

  const session = await createSessionForUser(app, env, user.id);
  return {
    response: {
      accessToken: session.response.accessToken
    },
    refreshToken: session.refreshToken
  };
}

export function logoutUser(userId: string): void {
  userRepository.clearRefreshTokenHash(userId);
}
