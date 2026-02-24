import type { FastifyPluginAsync } from "fastify";

import type {
  AccessTokenResponse,
  AuthMessageResponse,
  AuthSuccessResponse,
  ForgotPasswordInput,
  LogoutResponse,
  ResetPasswordInput,
  RegisterInput
} from "@crypto/shared";

import type { AppEnv } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import { getAuthUser, requireAccessToken } from "./auth.guard.js";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "./auth.tokens.js";
import {
  forgotPassword,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  resetPassword
} from "./auth.service.js";

function responseObjectSchema(required: string[], properties: Record<string, unknown>) {
  return {
    type: "object",
    required,
    properties
  };
}

const authRoutes: FastifyPluginAsync<{ env: AppEnv }> = async (app, options) => {
  const { env } = options;

  app.post<{ Body: RegisterInput; Reply: AuthSuccessResponse }>(
    "/auth/register",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      },
      schema: {
        tags: ["Auth"],
        summary: "Register user",
        body: responseObjectSchema(["name", "email", "password"], {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 }
        }),
        response: {
          201: responseObjectSchema(["accessToken", "user"], {
            accessToken: { type: "string" },
            user: responseObjectSchema(["id", "name", "email"], {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string", format: "email" }
            })
          })
        }
      }
    },
    async (request, reply) => {
      const session = await registerUser(app, env, request.body);
      setRefreshTokenCookie(reply, session.refreshToken, env);
      request.log.info(
        { event: "auth.register", userId: session.response.user.id },
        "user registered"
      );
      return reply.status(201).send(session.response);
    }
  );

  app.post(
    "/auth/login",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute"
        }
      },
      schema: {
        tags: ["Auth"],
        summary: "User login"
      }
    },
    async (request, reply) => {
      const session = await loginUser(app, env, request.body);
      setRefreshTokenCookie(reply, session.refreshToken, env);
      request.log.info({ event: "auth.login", userId: session.response.user.id }, "user logged in");
      return reply.send(session.response);
    }
  );

  app.post<{ Reply: AccessTokenResponse }>(
    "/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "Renew access token"
      }
    },
    async (request, reply) => {
      const refreshToken = request.cookies.refreshToken;
      if (!refreshToken) {
        throw new AppError("Missing refresh token", 401);
      }

      const session = await refreshSession(app, env, refreshToken);
      setRefreshTokenCookie(reply, session.refreshToken, env);
      request.log.info({ event: "auth.refresh" }, "session refreshed");
      return reply.send(session.response);
    }
  );

  app.delete<{ Reply: LogoutResponse }>(
    "/auth/logout",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Auth"],
        summary: "User logout"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      await logoutUser(authUser.sub);
      clearRefreshTokenCookie(reply, env);
      request.log.info({ event: "auth.logout", userId: authUser.sub }, "user logged out");
      return reply.send({ message: "Logged out successfully" });
    }
  );

  app.post<{ Body: ForgotPasswordInput; Reply: AuthMessageResponse }>(
    "/auth/forgot-password",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute"
        }
      },
      schema: {
        tags: ["Auth"],
        summary: "Request password reset"
      }
    },
    async (request, reply) => {
      const payload = await forgotPassword(env, request.body);
      request.log.info({ event: "auth.forgot_password" }, "password reset requested");
      return reply.send(payload);
    }
  );

  app.post<{ Body: ResetPasswordInput; Reply: AuthMessageResponse }>(
    "/auth/reset-password",
    {
      schema: {
        tags: ["Auth"],
        summary: "Reset password with token"
      }
    },
    async (request, reply) => {
      const payload = await resetPassword(request.body);
      request.log.info({ event: "auth.reset_password" }, "password reset completed");
      return reply.send(payload);
    }
  );
};

export default authRoutes;
