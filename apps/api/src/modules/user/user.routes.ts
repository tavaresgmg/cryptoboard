import type { FastifyPluginAsync } from "fastify";

import type {
  AvatarUpdateResponse,
  FavoriteListResponse,
  FavoritesResponse,
  UpdateUserProfileInput,
  UserProfile
} from "@crypto/shared";
import { updateUserProfileInputSchema } from "@crypto/shared";

import type { AppEnv } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import { getAuthUser, requireAccessToken } from "../auth/auth.guard.js";
import { getCoinPaprikaService } from "../crypto/crypto.service.js";
import { getStorageService } from "../../services/storage.service.js";
import { toUserProfile, userRepository } from "./user.repository.js";

const MAX_FAVORITES = 50;

function normalizeCoinId(coinId: string): string {
  return coinId.trim();
}

const userRoutes: FastifyPluginAsync<{ env: AppEnv }> = async (app, options) => {
  const cryptoService = getCoinPaprikaService(options.env.COINPAPRIKA_BASE_URL);
  const storageService = getStorageService(options.env);

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

  app.put<{ Body: UpdateUserProfileInput; Reply: UserProfile }>(
    "/users/me",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Atualizar perfil do usuario autenticado"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const payload = updateUserProfileInputSchema.parse(request.body);

      if (payload.email) {
        const existingUser = await userRepository.findByEmail(payload.email);
        if (existingUser && existingUser._id.toString() !== authUser.sub) {
          throw new AppError("Email ja cadastrado", 409);
        }
      }

      const updatedUser = await userRepository.updateProfile(authUser.sub, payload);
      if (!updatedUser) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      return reply.send(toUserProfile(updatedUser));
    }
  );

  app.put<{ Reply: AvatarUpdateResponse }>(
    "/users/me/avatar",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Fazer upload de avatar"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);

      if (!request.isMultipart()) {
        throw new AppError("Requisicao deve ser multipart/form-data", 400);
      }

      const part = await request.file();

      if (!part) {
        throw new AppError("Arquivo de avatar nao enviado", 400);
      }

      if (!part.mimetype.startsWith("image/")) {
        throw new AppError("Apenas arquivos de imagem sao permitidos", 400);
      }

      const avatarBytes = await part.toBuffer();
      if (avatarBytes.length === 0) {
        throw new AppError("Arquivo de avatar vazio", 400);
      }

      const avatarKey = await storageService.uploadAvatar(authUser.sub, avatarBytes, part.mimetype);
      const updatedUser = await userRepository.setAvatarKey(authUser.sub, avatarKey);
      if (!updatedUser) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      return reply.send({
        message: "Avatar atualizado com sucesso"
      });
    }
  );

  app.get(
    "/users/me/avatar",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Obter avatar do usuario via URL assinada"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      if (!user.avatarKey) {
        throw new AppError("Usuario sem avatar", 404);
      }

      const avatarSignedUrl = await storageService.getAvatarSignedUrl(user.avatarKey);
      return reply.redirect(avatarSignedUrl);
    }
  );

  app.post<{ Params: { coinId: string }; Reply: FavoritesResponse }>(
    "/users/me/favorites/:coinId",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Adicionar favorito"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      const coinId = normalizeCoinId(request.params.coinId);
      if (!coinId) {
        throw new AppError("CoinId invalido", 400);
      }

      if (user.favorites.includes(coinId)) {
        throw new AppError("Criptomoeda ja favoritada", 409);
      }

      if (user.favorites.length >= MAX_FAVORITES) {
        throw new AppError("Limite de favoritos atingido", 400);
      }

      const coinExists = await cryptoService.hasCoinId(coinId);
      if (!coinExists) {
        throw new AppError("Criptomoeda nao encontrada", 404);
      }

      const updated = await userRepository.addFavorite(authUser.sub, coinId);
      if (!updated) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      return reply.status(201).send({ favorites: updated.favorites });
    }
  );

  app.delete<{ Params: { coinId: string }; Reply: FavoritesResponse }>(
    "/users/me/favorites/:coinId",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Remover favorito"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      const coinId = normalizeCoinId(request.params.coinId);
      if (!coinId) {
        throw new AppError("CoinId invalido", 400);
      }

      if (!user.favorites.includes(coinId)) {
        throw new AppError("Criptomoeda nao estava nos favoritos", 404);
      }

      const updated = await userRepository.removeFavorite(authUser.sub, coinId);
      if (!updated) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      return reply.send({ favorites: updated.favorites });
    }
  );

  app.get<{ Reply: FavoriteListResponse }>(
    "/users/me/favorites",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Listar favoritos com dados de mercado"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("Usuario nao encontrado", 404);
      }

      const data = await cryptoService.getByIds(user.favorites);
      return reply.send({ data });
    }
  );
};

export default userRoutes;
