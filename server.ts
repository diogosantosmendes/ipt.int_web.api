import 'dotenv/config';

import { initRestApp } from './src/interfaces/rest';
import Repositories from './src/application/ports';
import { initUseCases } from './src/application/use-cases';

async function initRepositories(): Promise<{
  repositories: Repositories;
  close: () => Promise<void>;
}> {
  if (process.env.MONGODB_URI) {
    const { default: createMongoRepository } = await import('./src/infrastructure/database/mongo');
    return await createMongoRepository(process.env.MONGODB_URI);
  } else {
    const { default: createInMemoryRepository } = await import('./src/infrastructure/database/in-memory');
    return await createInMemoryRepository();
  }
}

async function startServer(): Promise<void> {
  const db = await initRepositories();

  const useCases = initUseCases(db.repositories);

  const app = initRestApp(useCases);


  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      app.close();
      await db.close();
      process.exit(0);
    });
  }
}

startServer().catch((error: unknown) => {
  console.error('Failed to start API:', error instanceof Error ? error.message : error);
  process.exit(1);
});