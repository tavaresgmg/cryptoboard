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
        summary: "Get authenticated user profile"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("User not found", 404);
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
        summary: "Update authenticated user profile"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const payload = updateUserProfileInputSchema.parse(request.body);

      const currentUser = await userRepository.findById(authUser.sub);
      if (!currentUser) {
        throw new AppError("User not found", 404);
      }

      if (payload.email) {
        const existingUser = await userRepository.findByEmail(payload.email);
        if (existingUser && existingUser._id.toString() !== authUser.sub) {
          throw new AppError("Email already registered", 409);
        }
      }

      const updatedUser = await userRepository.updateProfile(authUser.sub, payload);
      if (!updatedUser) {
        throw new AppError("User not found", 404);
      }

      if (payload.email && payload.email.trim().toLowerCase() !== currentUser.email) {
        await userRepository.clearRefreshTokenHash(authUser.sub);
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
        summary: "Upload avatar"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);

      if (!request.isMultipart()) {
        throw new AppError("Request must be multipart/form-data", 400);
      }

      const part = await request.file();

      if (!part) {
        throw new AppError("Avatar file not provided", 400);
      }

      if (!part.mimetype.startsWith("image/")) {
        throw new AppError("Only image files are allowed", 400);
      }

      const avatarBytes = await part.toBuffer();
      if (avatarBytes.length === 0) {
        throw new AppError("Avatar file is empty", 400);
      }

      const currentUser = await userRepository.findById(authUser.sub);
      const oldAvatarKey = currentUser?.avatarKey;

      const avatarKey = await storageService.uploadAvatar(authUser.sub, avatarBytes, part.mimetype);
      const updatedUser = await userRepository.setAvatarKey(authUser.sub, avatarKey);
      if (!updatedUser) {
        throw new AppError("User not found", 404);
      }

      if (oldAvatarKey) {
        await storageService.deleteObject(oldAvatarKey);
      }

      return reply.send({
        message: "Avatar updated successfully"
      });
    }
  );

  app.get<{ Reply: { url: string } }>(
    "/users/me/avatar-url",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Get user avatar signed URL"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (!user.avatarKey) {
        throw new AppError("User has no avatar", 404);
      }

      const avatarSignedUrl = await storageService.getAvatarSignedUrl(user.avatarKey);
      return reply.send({ url: avatarSignedUrl });
    }
  );

  app.get(
    "/users/me/avatar",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Get user avatar via signed URL"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (!user.avatarKey) {
        throw new AppError("User has no avatar", 404);
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
        summary: "Add favorite"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);

      const coinId = normalizeCoinId(request.params.coinId);
      if (!coinId) {
        throw new AppError("Invalid CoinId", 400);
      }

      const coinExists = await cryptoService.hasCoinId(coinId);
      if (!coinExists) {
        throw new AppError("Cryptocurrency not found", 404);
      }

      const { user, reason } = await userRepository.addFavoriteAtomic(authUser.sub, coinId, MAX_FAVORITES);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      if (reason === "duplicate") {
        throw new AppError("Cryptocurrency already favorited", 409);
      }

      if (reason === "limit") {
        throw new AppError("Favorites limit reached", 400);
      }

      return reply.status(201).send({ favorites: user.favorites });
    }
  );

  app.delete<{ Params: { coinId: string }; Reply: FavoritesResponse }>(
    "/users/me/favorites/:coinId",
    {
      preHandler: requireAccessToken,
      schema: {
        tags: ["Users"],
        summary: "Remove favorite"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const coinId = normalizeCoinId(request.params.coinId);
      if (!coinId) {
        throw new AppError("Invalid CoinId", 400);
      }

      if (!user.favorites.includes(coinId)) {
        throw new AppError("Cryptocurrency was not in favorites", 404);
      }

      const updated = await userRepository.removeFavorite(authUser.sub, coinId);
      if (!updated) {
        throw new AppError("User not found", 404);
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
        summary: "List favorites with market data"
      }
    },
    async (request, reply) => {
      const authUser = getAuthUser(request);
      const user = await userRepository.findById(authUser.sub);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const data = await cryptoService.getByIds(user.favorites);
      return reply.send({ data });
    }
  );
};

export default userRoutes;
