import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { loadEnv } from "./config/env.js";
import { buildServer } from "./server.js";

async function bootstrap() {
  const env = loadEnv();
  await connectDatabase(env.MONGODB_URI);
  const app = await buildServer(env);

  const shutdown = async () => {
    await app.close();
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT
    });
  } catch (error) {
    app.log.error(error);
    await disconnectDatabase();
    process.exit(1);
  }
}

void bootstrap();
