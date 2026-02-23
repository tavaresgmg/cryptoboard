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
      schema: {
        tags: ["Auth"],
        summary: "Cadastrar usuario",
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
      return reply.status(201).send(session.response);
    }
  );

  app.post("/auth/login", {
    schema: {
      tags: ["Auth"],
      summary: "Login do usuario"
    }
  }, async (request, reply) => {
    const session = await loginUser(app, env, request.body);
    setRefreshTokenCookie(reply, session.refreshToken, env);
    return reply.send(session.response);
  });

  app.post<{ Reply: AccessTokenResponse }>("/auth/refresh", {
    schema: {
      tags: ["Auth"],
      summary: "Renovar access token"
    }
  }, async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError("Refresh token ausente", 401);
    }

    const session = await refreshSession(app, env, refreshToken);
    setRefreshTokenCookie(reply, session.refreshToken, env);
    return reply.send(session.response);
  });

  app.delete<{ Reply: LogoutResponse }>(
    "/auth/logout",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Auth"],
        summary: "Logout do usuario"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      await logoutUser(authUser.sub);
      clearRefreshTokenCookie(reply, env);
      return reply.send({ message: "Logout realizado com sucesso" });
    }
  );

  app.post<{ Body: ForgotPasswordInput; Reply: AuthMessageResponse }>(
    "/auth/forgot-password",
    {
      schema: {
        tags: ["Auth"],
        summary: "Solicitar redefinicao de senha"
      }
    },
    async (request, reply) => {
      const payload = await forgotPassword(env, request.body);
      return reply.send(payload);
    }
  );

  app.post<{ Body: ResetPasswordInput; Reply: AuthMessageResponse }>(
    "/auth/reset-password",
    {
      schema: {
        tags: ["Auth"],
        summary: "Redefinir senha com token"
      }
    },
    async (request, reply) => {
      const payload = await resetPassword(request.body);
      return reply.send(payload);
    }
  );
};

export default authRoutes;
