import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../config/env.js";

export async function registerSecurity(app: FastifyInstance, env: AppEnv): Promise<void> {
  await app.register(helmet, {
    global: true
  });

  await app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_TIME_WINDOW
  });
}
