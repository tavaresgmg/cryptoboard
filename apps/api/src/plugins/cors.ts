import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../config/env.js";

function parseOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export async function registerCors(app: FastifyInstance, env: AppEnv): Promise<void> {
  const allowedOrigins = parseOrigins(env.WEB_ORIGIN);

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true
  });
}
