import { UserWithOrganization } from '../repositories/UserRepository';

declare module 'fastify' {
  interface FastifyRequest {
    currentUser?: UserWithOrganization;
  }
}
