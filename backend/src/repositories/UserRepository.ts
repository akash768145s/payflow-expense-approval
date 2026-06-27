import { prisma } from '../lib/prisma';
import { User, Organization } from '@prisma/client';
import { Role } from '../types/constants';

export type UserWithOrganization = User & {
  organization: Organization;
};

export class UserRepository {
  async findById(id: string): Promise<UserWithOrganization | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    }) as Promise<UserWithOrganization | null>;
  }

  async findByEmail(email: string): Promise<UserWithOrganization | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    }) as Promise<UserWithOrganization | null>;
  }

  async findByOrganization(organizationId: string): Promise<User[]> {
    return prisma.user.findMany({
      where: { organizationId },
    });
  }

  async createUser(data: {
    organizationId: string;
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
  }): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
}
