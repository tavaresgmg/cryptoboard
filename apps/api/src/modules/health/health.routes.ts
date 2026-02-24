import type { FastifyPluginAsync } from "fastify";

import type { HealthResponse } from "@crypto/shared";

const healthSchema = {
  tags: ["Health"],
  summary: "API health check",
  response: {
    200: {
      type: "object",
      required: ["status", "timestamp"],
      properties: {
        status: {
          type: "string",
          enum: ["ok"]
        },
        timestamp: {
          type: "string",
          format: "date-time"
        }
      }
    }
  }
} as const;

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Reply: HealthResponse }>("/health", { schema: healthSchema }, async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString()
    };
  });
};

export default healthRoutes;
