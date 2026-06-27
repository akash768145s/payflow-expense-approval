import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService';
import { UnauthorizedError } from '../utils/errors';

export function makeAuthMiddleware(authService: AuthService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = request.cookies.session;
    if (!sessionId) {
      throw new UnauthorizedError('Authentication required');
    }

    try {
      const user = await authService.validateSession(sessionId);
      request.currentUser = user;
    } catch (error) {
      throw new UnauthorizedError('Session expired or invalid');
    }
  };
}
