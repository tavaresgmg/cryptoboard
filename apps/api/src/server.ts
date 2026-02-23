import Fastify from "fastify";
import { ZodError } from "zod";

import type { AppEnv } from "./config/env.js";
import { AppError } from "./lib/app-error.js";
import authRoutes from "./modules/auth/auth.routes.js";
import healthRoutes from "./modules/health/health.routes.js";
import userRoutes from "./modules/user/user.routes.js";
import { registerAuth } from "./plugins/auth.js";
import { registerCors } from "./plugins/cors.js";
import { registerSwagger } from "./plugins/swagger.js";

export async function buildServer(env: AppEnv) {
  const app = Fastify({
    logger: true
  });

  await registerCors(app, env);
  await registerAuth(app, env);
  await registerSwagger(app);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Validation Error",
        message: "Dados invalidos",
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message
        }))
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: "App Error",
        message: error.message,
        details: error.details
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Erro interno no servidor"
    });
  });

  await app.register(healthRoutes);
  await app.register(authRoutes, { env });
  await app.register(userRoutes);

  return app;
}
