import { connectDatabase, disconnectDatabase } from "../config/db.js";
import { loadEnv } from "../config/env.js";
import { hashPassword } from "../lib/security.js";
import { UserModel } from "../modules/user/user.model.js";

async function run() {
  const env = loadEnv();
  await connectDatabase(env.MONGODB_URI);

  try {
    const email = "demo@erictel.local";
    const password = "12345678";

    const existing = await UserModel.findOne({ email }).exec();
    if (existing) {
      console.log(`Seed already exists: ${email}`);
      return;
    }

    const passwordHash = await hashPassword(password);
    await UserModel.create({
      name: "Demo User",
      email,
      passwordHash,
      description: "User created by seed",
      preferredCurrency: "USD",
      favorites: ["btc-bitcoin", "eth-ethereum"]
    });

    console.log("Seed completed successfully");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } finally {
    await disconnectDatabase();
  }
}

run().catch((error) => {
  console.error("Seed execution failed", error);
  process.exit(1);
});
