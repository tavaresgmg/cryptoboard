import type { AuthUser, UpdateUserProfileInput, UserProfile } from "@crypto/shared";

import { UserModel, type UserDocument } from "./user.model.js";

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

class UserRepository {
  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalizedEmail = normalizeEmail(email);
    return UserModel.findOne({ email: normalizedEmail }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return UserModel.findById(id).exec();
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const user = await UserModel.create({
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash
    });

    return user;
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          refreshTokenHash
        }
      },
      { new: false }
    ).exec();
  }

  async clearRefreshTokenHash(userId: string): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $unset: {
          refreshTokenHash: 1
        }
      },
      { new: false }
    ).exec();
  }

  async addFavorite(userId: string, coinId: string): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          favorites: coinId
        }
      },
      { new: true }
    ).exec();
  }

  async addFavoriteAtomic(
    userId: string,
    coinId: string,
    maxFavorites: number
  ): Promise<{ user: UserDocument | null; reason?: "duplicate" | "limit" }> {
    const result = await UserModel.findOneAndUpdate(
      {
        _id: userId,
        favorites: { $ne: coinId },
        [`favorites.${maxFavorites - 1}`]: { $exists: false }
      },
      {
        $addToSet: { favorites: coinId }
      },
      { new: true }
    ).exec();

    if (result) {
      return { user: result };
    }

    const existing = await UserModel.findById(userId).exec();
    if (!existing) {
      return { user: null };
    }

    if (existing.favorites.includes(coinId)) {
      return { user: existing, reason: "duplicate" };
    }

    return { user: existing, reason: "limit" };
  }

  async removeFavorite(userId: string, coinId: string): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $pull: {
          favorites: coinId
        }
      },
      { new: true }
    ).exec();
  }

  async updateProfile(
    userId: string,
    input: UpdateUserProfileInput
  ): Promise<UserDocument | null> {
    const update: Partial<{
      name: string;
      email: string;
      description: string | undefined;
      preferredCurrency: UpdateUserProfileInput["preferredCurrency"];
    }> = {};

    if (input.name !== undefined) {
      update.name = input.name.trim();
    }

    if (input.email !== undefined) {
      update.email = normalizeEmail(input.email);
    }

    if (input.description !== undefined) {
      update.description = input.description;
    }

    if (input.preferredCurrency !== undefined) {
      update.preferredCurrency = input.preferredCurrency;
    }

    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: update
      },
      { new: true }
    ).exec();
  }

  async setPasswordResetToken(
    userId: string,
    passwordResetTokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          passwordResetTokenHash,
          passwordResetTokenExpiresAt: expiresAt
        }
      },
      { new: false }
    ).exec();
  }

  async findByPasswordResetTokenHash(tokenHash: string): Promise<UserDocument | null> {
    return UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: { $gt: new Date() }
    }).exec();
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          passwordHash
        },
        $unset: {
          refreshTokenHash: 1,
          passwordResetTokenHash: 1,
          passwordResetTokenExpiresAt: 1
        }
      },
      { new: false }
    ).exec();
  }

  async setAvatarKey(userId: string, avatarKey: string): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          avatarKey
        }
      },
      { new: true }
    ).exec();
  }
}

export const userRepository = new UserRepository();

export function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

export function toUserProfile(user: UserDocument): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    description: user.description ?? undefined,
    hasAvatar: Boolean(user.avatarKey),
    preferredCurrency: user.preferredCurrency,
    favorites: user.favorites,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}
