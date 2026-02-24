import type { SupportedCurrency } from "@crypto/shared";
import mongoose from "mongoose";

const supportedCurrencies: SupportedCurrency[] = ["USD", "EUR", "BRL", "GBP"];

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  description?: string;
  avatarKey?: string;
  preferredCurrency: SupportedCurrency;
  favorites: string[];
  refreshTokenHash?: string;
  passwordResetTokenHash?: string;
  passwordResetTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: 500
    },
    avatarKey: {
      type: String
    },
    preferredCurrency: {
      type: String,
      enum: supportedCurrencies,
      default: "USD"
    },
    favorites: {
      type: [String],
      default: []
    },
    refreshTokenHash: {
      type: String
    },
    passwordResetTokenHash: {
      type: String
    },
    passwordResetTokenExpiresAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

export type UserDocument = mongoose.HydratedDocument<User>;

export const UserModel = mongoose.model<User>("User", userSchema);
