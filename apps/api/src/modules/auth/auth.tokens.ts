import { randomUUID } from "node:crypto";

import type { FastifyInstance, FastifyReply } from "fastify";

import type { AppEnv } from "../../config/env.js";

export interface TokenPayload {
  sub: string;
  email: string;
  jti: string;
  tokenType: "access" | "refresh";
}

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export async function issueSessionTokens(
  app: FastifyInstance,
  env: AppEnv,
  payload: { userId: string; email: string }
): Promise<SessionTokens> {
  const accessToken = await app.jwt.sign(
    {
      sub: payload.userId,
      email: payload.email,
      jti: randomUUID(),
      tokenType: "access"
    },
    {
      expiresIn: env.JWT_ACCESS_EXPIRATION
    }
  );

  const refreshToken = await app.jwt.sign(
    {
      sub: payload.userId,
      email: payload.email,
      jti: randomUUID(),
      tokenType: "refresh"
    },
    {
      expiresIn: env.JWT_REFRESH_EXPIRATION
    }
  );

  return {
    accessToken,
    refreshToken
  };
}

export function setRefreshTokenCookie(reply: FastifyReply, token: string, env: AppEnv): void {
  reply.setCookie("refreshToken", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.AUTH_COOKIE_SECURE,
    path: "/auth",
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearRefreshTokenCookie(reply: FastifyReply, env: AppEnv): void {
  reply.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: env.AUTH_COOKIE_SECURE,
    path: "/auth"
  });
}

export async function verifyToken(app: FastifyInstance, token: string): Promise<TokenPayload> {
  return app.jwt.verify<TokenPayload>(token);
}
