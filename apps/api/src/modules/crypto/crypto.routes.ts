import type { FastifyPluginAsync } from "fastify";

import type { CryptoDetail, CryptoListResponse } from "@crypto/shared";

import type { AppEnv } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import { getAuthUser, requireAccessToken } from "../auth/auth.guard.js";
import { getCoinPaprikaService } from "./crypto.service.js";
import { userRepository } from "../user/user.repository.js";

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
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const payload = await cryptoService.list(request.query, user.preferredCurrency);
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
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const payload = await cryptoService.getById(request.params.id, user.preferredCurrency);
      return reply.send(payload);
    }
  );
};

export default cryptoRoutes;
