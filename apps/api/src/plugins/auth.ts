import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../config/env.js";

export async function registerAuth(app: FastifyInstance, env: AppEnv): Promise<void> {
  await app.register(cookie);
  await app.register(jwt, {
    secret: env.JWT_SECRET
  });
}
