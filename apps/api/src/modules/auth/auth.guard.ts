import type { FastifyRequest } from "fastify";

import { AppError } from "../../lib/app-error.js";
import type { TokenPayload } from "./auth.tokens.js";
import { verifyToken } from "./auth.tokens.js";

interface AuthenticatedRequest extends FastifyRequest {
  authUser: TokenPayload;
}

export async function requireAccessToken(request: FastifyRequest): Promise<void> {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("Missing access token", 401);
  }

  const token = authorization.slice("Bearer ".length).trim();

  let payload: TokenPayload;
  try {
    payload = await verifyToken(request.server, token);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  if (payload.tokenType !== "access") {
    throw new AppError("Invalid access token", 401);
  }

  (request as AuthenticatedRequest).authUser = payload;
}

export function getAuthUser(request: FastifyRequest): TokenPayload {
  const authRequest = request as AuthenticatedRequest;
  if (!authRequest.authUser) {
    throw new AppError("User not authenticated", 401);
  }

  return authRequest.authUser;
}
