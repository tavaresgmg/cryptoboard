import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

import type { AppEnv } from "./config/env.js";
import { AppError } from "./lib/app-error.js";
import authRoutes from "./modules/auth/auth.routes.js";
import cryptoRoutes from "./modules/crypto/crypto.routes.js";
import { getCoinPaprikaService } from "./modules/crypto/crypto.service.js";
import healthRoutes from "./modules/health/health.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import { registerAuth } from "./plugins/auth.js";
import { registerCors } from "./plugins/cors.js";
import { registerSecurity } from "./plugins/security.js";
import { registerSwagger } from "./plugins/swagger.js";
import { registerUpload } from "./plugins/upload.js";

interface HttpErrorLike {
  statusCode?: unknown;
  name?: unknown;
  message?: unknown;
}

function getClientHttpError(
  error: unknown
): { statusCode: number; name: string; message: string } | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const parsedError = error as HttpErrorLike;
  const statusCode = parsedError.statusCode;
  if (
    typeof statusCode !== "number" ||
    !Number.isInteger(statusCode) ||
    statusCode < 400 ||
    statusCode >= 500
  ) {
    return null;
  }

  return {
    statusCode,
    name: typeof parsedError.name === "string" ? parsedError.name : "Client Error",
    message: typeof parsedError.message === "string" ? parsedError.message : "Invalid request"
  };
}

export async function buildServer(env: AppEnv) {
  const isTest = env.NODE_ENV === "test";
  const app = Fastify({
    logger: isTest
      ? false
      : {
          level: env.LOG_LEVEL,
          formatters: {
            level(label) {
              return { level: label };
            }
          },
          serializers: {
            req(request) {
              return {
                method: request.method,
                url: request.url,
                requestId: request.id
              };
            },
            res(reply) {
              return {
                statusCode: reply.statusCode
              };
            }
          }
        },
    genReqId: () => randomUUID(),
    disableRequestLogging: isTest
  });

  await registerCors(app, env);
  await registerSecurity(app, env);
  await registerAuth(app, env);
  await registerUpload(app, env);
  await registerSwagger(app);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      request.log.warn(
        { event: "validation_error", issues: error.issues },
        "request validation failed"
      );
      return reply.status(400).send({
        statusCode: 400,
        error: "Validation Error",
        message: "Validation failed",
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message
        }))
      });
    }

    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        request.log.error({ event: "app_error", statusCode: error.statusCode }, error.message);
      }
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: "App Error",
        message: error.message,
        details: error.details
      });
    }

    const clientHttpError = getClientHttpError(error);
    if (clientHttpError) {
      return reply.status(clientHttpError.statusCode).send({
        statusCode: clientHttpError.statusCode,
        error: clientHttpError.name,
        message: clientHttpError.message
      });
    }

    request.log.error({ event: "unhandled_error", err: error }, "internal server error");
    return reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Internal server error"
    });
  });

  await app.register(healthRoutes);
  await app.register(authRoutes, { env });
  await app.register(userRoutes, { env });
  await app.register(cryptoRoutes, { env });

  if (!isTest) {
    const cryptoService = getCoinPaprikaService(env.COINPAPRIKA_BASE_URL);
    void cryptoService.warmup().catch((error) => {
      app.log.warn({ event: "crypto_warmup_failed", err: error }, "crypto warmup failed");
    });
  }

  return app;
}
