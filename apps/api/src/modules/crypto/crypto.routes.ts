import type { FastifyPluginAsync } from "fastify";

import type { CryptoDetail, CryptoListResponse } from "@crypto/shared";

import type { AppEnv } from "../../config/env.js";
import { requireAccessToken } from "../auth/auth.guard.js";
import { getCoinPaprikaService } from "./crypto.service.js";

const cryptoRoutes: FastifyPluginAsync<{ env: AppEnv }> = async (app, options) => {
  const cryptoService = getCoinPaprikaService(options.env.COINPAPRIKA_BASE_URL);

  app.get<{ Reply: CryptoListResponse }>(
    "/crypto",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Crypto"],
        summary: "List cryptocurrencies"
      }
    },
    async (request, reply) => {
      const payload = await cryptoService.list(request.query);
      return reply.send(payload);
    }
  );

  app.get<{ Params: { id: string }; Reply: CryptoDetail }>(
    "/crypto/:id",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Crypto"],
        summary: "Get cryptocurrency details"
      }
    },
    async (request, reply) => {
      const payload = await cryptoService.getById(request.params.id);
      return reply.send(payload);
    }
  );
};

export default cryptoRoutes;
