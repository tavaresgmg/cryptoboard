import type { AuthUser, UserProfile } from "@crypto/shared";

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
    preferredCurrency: user.preferredCurrency,
    favorites: user.favorites,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}
