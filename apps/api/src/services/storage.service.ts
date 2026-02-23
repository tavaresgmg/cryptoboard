import { randomUUID } from "node:crypto";

import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { AppEnv } from "../config/env.js";
import { AppError } from "../lib/app-error.js";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

class StorageService {
  private readonly writeClient: S3Client;
  private readonly readClient: S3Client;
  private readonly bucket: string;
  private bucketEnsured = false;

  constructor(private readonly env: AppEnv) {
    this.bucket = env.S3_BUCKET;

    this.writeClient = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY
      }
    });

    this.readClient =
      env.S3_PUBLIC_ENDPOINT && env.S3_PUBLIC_ENDPOINT !== env.S3_ENDPOINT
        ? new S3Client({
            region: env.S3_REGION,
            endpoint: env.S3_PUBLIC_ENDPOINT,
            forcePathStyle: true,
            credentials: {
              accessKeyId: env.S3_ACCESS_KEY,
              secretAccessKey: env.S3_SECRET_KEY
            }
          })
        : this.writeClient;
  }

  private ensureSupportedMimeType(mimeType: string): void {
    if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
      throw new AppError("Tipo de arquivo nao suportado", 400);
    }
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured) {
      return;
    }

    try {
      await this.writeClient.send(
        new HeadBucketCommand({
          Bucket: this.bucket
        })
      );
      this.bucketEnsured = true;
      return;
    } catch {
      try {
        await this.writeClient.send(
          new CreateBucketCommand({
            Bucket: this.bucket
          })
        );
        this.bucketEnsured = true;
      } catch (error) {
        throw new AppError("Nao foi possivel preparar o bucket de avatar", 502, {
          cause: error instanceof Error ? error.message : "unknown"
        });
      }
    }
  }

  async uploadAvatar(userId: string, file: Buffer, mimeType: string): Promise<string> {
    this.ensureSupportedMimeType(mimeType);
    await this.ensureBucket();

    const extension = EXTENSION_BY_MIME[mimeType];
    const key = `avatars/${userId}/${Date.now()}-${randomUUID()}.${extension}`;

    try {
      await this.writeClient.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: mimeType
        })
      );
    } catch (error) {
      throw new AppError("Falha ao enviar avatar para storage", 502, {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }

    return key;
  }

  async getAvatarSignedUrl(key: string): Promise<string> {
    await this.ensureBucket();

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      return getSignedUrl(this.readClient, command, { expiresIn: 15 * 60 });
    } catch (error) {
      throw new AppError("Falha ao obter URL assinada do avatar", 502, {
        cause: error instanceof Error ? error.message : "unknown"
      });
    }
  }
}

const serviceByConfigKey = new Map<string, StorageService>();

function toConfigKey(env: AppEnv): string {
  return [
    env.S3_ENDPOINT,
    env.S3_PUBLIC_ENDPOINT ?? env.S3_ENDPOINT,
    env.S3_BUCKET,
    env.S3_REGION,
    env.S3_ACCESS_KEY
  ].join("|");
}

export function getStorageService(env: AppEnv): StorageService {
  const key = toConfigKey(env);
  const existing = serviceByConfigKey.get(key);
  if (existing) {
    return existing;
  }

  const created = new StorageService(env);
  serviceByConfigKey.set(key, created);
  return created;
}
