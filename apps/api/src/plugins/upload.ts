import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";

import type { AppEnv } from "../config/env.js";

export async function registerUpload(app: FastifyInstance, env: AppEnv): Promise<void> {
  await app.register(multipart, {
    limits: {
      files: 1,
      fileSize: env.AVATAR_MAX_BYTES
    }
  });
}
