import mongoose from "mongoose";

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri);
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
}
