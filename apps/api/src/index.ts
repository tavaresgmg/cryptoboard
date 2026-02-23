import { loadEnv } from "./config/env.js";
import { buildServer } from "./server.js";

async function bootstrap() {
  const env = loadEnv();
  const app = await buildServer(env);

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void bootstrap();
