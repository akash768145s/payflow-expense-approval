import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import { config } from './config';
import { errorHandler } from './utils/errorHandler';
import { registerRoutes } from './routes';

export function buildApp() {
  const app = Fastify({
    logger: config.nodeEnv !== 'test',
  });

  // Register CORS
  app.register(fastifyCors, {
    origin: (origin, cb) => {
      // In development/test, allow all localhost and credentials-based requests.
      // In production, we'd limit this to specific origins.
      cb(null, true);
    },
    credentials: true,
  });

  // Register Cookie
  app.register(fastifyCookie, {
    secret: config.cookieSecret,
  });

  // Centralized Error Handler
  app.setErrorHandler(errorHandler);

  // Register Routes
  app.register(registerRoutes);

  return app;
}
export type FastifyAppInstance = ReturnType<typeof buildApp>;
