import type { FastifyPluginAsync } from "fastify";

import type { UserProfile } from "@crypto/shared";

import { AppError } from "../../lib/app-error.js";
import { getAuthUser, requireAccessToken } from "../auth/auth.guard.js";
import { toUserProfile, userRepository } from "./user.repository.js";

const userRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Reply: UserProfile }>(
    "/users/me",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Obter perfil do usuario autenticado"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      return reply.send(toUserProfile(user));
    }
  );
};

export default userRoutes;
