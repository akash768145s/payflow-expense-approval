import { buildApp } from './app';
import { config } from './config';

const server = buildApp();

const start = async () => {
  try {
    const address = await server.listen({ port: config.port, host: '0.0.0.0' });
    server.log.info(`Server listening on ${address}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
