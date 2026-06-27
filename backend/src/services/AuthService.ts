import * as bcrypt from 'bcrypt';
import { UserRepository, UserWithOrganization } from '../repositories/UserRepository';
import { SessionRepository, SessionWithUser } from '../repositories/SessionRepository';
import { UnauthorizedError } from '../utils/errors';
import { Session } from '@prisma/client';

export class AuthService {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;

  constructor(userRepository: UserRepository, sessionRepository: SessionRepository) {
    this.userRepository = userRepository;
    this.sessionRepository = sessionRepository;
  }

  async login(email: string, passwordPlain: string): Promise<{ session: Session; user: UserWithOrganization }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Session duration: 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await this.sessionRepository.createSession(user.id, expiresAt);

    return { session, user };
  }

  async logout(sessionId: string): Promise<void> {
    try {
      await this.sessionRepository.deleteSession(sessionId);
    } catch (e) {
      // If session already deleted/not found, ignore
    }
  }

  async validateSession(sessionId: string): Promise<UserWithOrganization> {
    const sessionWithUser = await this.sessionRepository.findSessionWithUser(sessionId);
    if (!sessionWithUser) {
      throw new UnauthorizedError('Session not found or expired');
    }

    if (sessionWithUser.expiresAt < new Date()) {
      // Delete expired session async
      this.sessionRepository.deleteSession(sessionId).catch(() => {});
      throw new UnauthorizedError('Session expired');
    }

    return sessionWithUser.user;
  }
}
