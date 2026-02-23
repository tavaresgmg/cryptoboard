import type { AuthUser, SupportedCurrency, UserProfile } from "@crypto/shared";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  description?: string;
  preferredCurrency: SupportedCurrency;
  favorites: string[];
  createdAt: Date;
  updatedAt: Date;
  refreshTokenHash?: string;
}

interface CreateUserInput {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

class UserRepository {
  private readonly usersById = new Map<string, StoredUser>();
  private readonly userIdByEmail = new Map<string, string>();

  findByEmail(email: string): StoredUser | undefined {
    const userId = this.userIdByEmail.get(normalizeEmail(email));
    if (!userId) {
      return undefined;
    }

    return this.usersById.get(userId);
  }

  findById(id: string): StoredUser | undefined {
    return this.usersById.get(id);
  }

  create(input: CreateUserInput): StoredUser {
    const now = new Date();
    const normalizedEmail = normalizeEmail(input.email);

    const user: StoredUser = {
      id: input.id,
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash: input.passwordHash,
      preferredCurrency: "USD",
      favorites: [],
      createdAt: now,
      updatedAt: now
    };

    this.usersById.set(user.id, user);
    this.userIdByEmail.set(user.email, user.id);

    return user;
  }

  updateRefreshTokenHash(userId: string, refreshTokenHash: string): void {
    const user = this.findById(userId);
    if (!user) {
      return;
    }

    user.refreshTokenHash = refreshTokenHash;
    user.updatedAt = new Date();
  }

  clearRefreshTokenHash(userId: string): void {
    const user = this.findById(userId);
    if (!user) {
      return;
    }

    user.refreshTokenHash = undefined;
    user.updatedAt = new Date();
  }
}

export const userRepository = new UserRepository();

export function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

export function toUserProfile(user: StoredUser): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    description: user.description,
    preferredCurrency: user.preferredCurrency,
    favorites: user.favorites,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}
