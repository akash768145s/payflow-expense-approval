import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/AuthService';
import { loginSchema } from '../validators';
import { config } from '../config';
import { BadRequestError } from '../utils/errors';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      throw new BadRequestError(parseResult.error.errors[0].message);
    }

    const { email, password } = parseResult.data;
    const { session, user } = await this.authService.login(email, password);

    reply.setCookie('session', session.id, {
      path: '/',
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    };
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = request.cookies.session;
    if (sessionId) {
      await this.authService.logout(sessionId);
    }

    reply.clearCookie('session', {
      path: '/',
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
    });

    return { success: true };
  };

  me = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.currentUser!;
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization.name,
      },
    };
  };
}
