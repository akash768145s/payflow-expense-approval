import { FastifyInstance } from 'fastify';
import { UserRepository } from '../repositories/UserRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { ExpenseClaimRepository } from '../repositories/ExpenseClaimRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';
import { AuthService } from '../services/AuthService';
import { StateMachineService } from '../services/StateMachineService';
import { ExpenseClaimService } from '../services/ExpenseClaimService';
import { AuthController } from '../controllers/AuthController';
import { ExpenseClaimController } from '../controllers/ExpenseClaimController';
import { makeAuthMiddleware } from '../middlewares/authMiddleware';

export async function registerRoutes(fastify: FastifyInstance) {
  // Dependency Injection (repositories)
  const userRepository = new UserRepository();
  const sessionRepository = new SessionRepository();
  const claimRepository = new ExpenseClaimRepository();
  const auditLogRepository = new AuditLogRepository();

  // Services
  const authService = new AuthService(userRepository, sessionRepository);
  const stateMachineService = new StateMachineService();
  const claimService = new ExpenseClaimService(
    claimRepository,
    auditLogRepository,
    stateMachineService
  );

  // Controllers
  const authController = new AuthController(authService);
  const claimController = new ExpenseClaimController(claimService);

  // Auth Middleware
  const authMiddleware = makeAuthMiddleware(authService);

  // Health
  fastify.get('/health', async () => {
    return { status: 'OK', timestamp: new Date().toISOString() };
  });

  // Authentication
  fastify.post('/auth/login', authController.login);
  fastify.post('/auth/logout', authController.logout);
  fastify.get('/auth/me', { preHandler: [authMiddleware] }, authController.me);

  // Claims Management
  fastify.get('/claims', { preHandler: [authMiddleware] }, claimController.listClaims);
  fastify.get('/claims/:id', { preHandler: [authMiddleware] }, claimController.getClaim);
  fastify.post('/claims', { preHandler: [authMiddleware] }, claimController.createClaim);
  fastify.patch('/claims/:id', { preHandler: [authMiddleware] }, claimController.updateClaim);
  fastify.delete('/claims/:id', { preHandler: [authMiddleware] }, claimController.deleteClaim);

  // Transitions
  fastify.post('/claims/:id/submit', { preHandler: [authMiddleware] }, claimController.submitClaim);
  fastify.post('/claims/:id/approve', { preHandler: [authMiddleware] }, claimController.approveClaim);
  fastify.post('/claims/:id/reject', { preHandler: [authMiddleware] }, claimController.rejectClaim);
  fastify.post('/claims/:id/mark-paid', { preHandler: [authMiddleware] }, claimController.markPaidClaim);
  fastify.post('/claims/:id/send-back', { preHandler: [authMiddleware] }, claimController.sendBackClaim);
}
export type AppRoutesType = typeof registerRoutes;
