import { prisma } from '../lib/prisma';
import { Organization } from '@prisma/client';

export class OrganizationRepository {
  async findById(id: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { id },
    });
  }

  async createOrganization(name: string): Promise<Organization> {
    return prisma.organization.create({
      data: { name },
    });
  }

  async findAll(): Promise<Organization[]> {
    return prisma.organization.findMany();
  }
}
