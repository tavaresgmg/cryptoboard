import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Crypto Dashboard API",
        description: "Fullstack technical challenge API",
        version: "0.1.0"
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs"
  });
}
