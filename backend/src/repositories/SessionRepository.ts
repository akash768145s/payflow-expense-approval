import { prisma } from '../lib/prisma';
import { Session, User, Organization } from '@prisma/client';

export type SessionWithUser = Session & {
  user: User & {
    organization: Organization;
  };
};

export class SessionRepository {
  async createSession(userId: string, expiresAt: Date): Promise<Session> {
    return prisma.session.create({
      data: {
        userId,
        expiresAt,
      },
    });
  }

  async findSessionWithUser(id: string): Promise<SessionWithUser | null> {
    return prisma.session.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    }) as Promise<SessionWithUser | null>;
  }

  async deleteSession(id: string): Promise<void> {
    await prisma.session.delete({
      where: { id },
    });
  }

  async deleteExpiredSessions(): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
