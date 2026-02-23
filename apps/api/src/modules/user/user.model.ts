import type { SupportedCurrency } from "@crypto/shared";
import mongoose from "mongoose";

const supportedCurrencies: SupportedCurrency[] = ["USD", "EUR", "BRL", "GBP"];

export interface User {
  name: string;
  email: string;
  passwordHash: string;
  description?: string;
  preferredCurrency: SupportedCurrency;
  favorites: string[];
  refreshTokenHash?: string;
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
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type UserDocument = mongoose.HydratedDocument<User>;

export const UserModel = mongoose.model<User>("User", userSchema);
