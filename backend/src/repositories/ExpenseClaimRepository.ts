import { prisma } from '../lib/prisma';
import { ExpenseClaim } from '@prisma/client';
import { Status } from '../types/constants';

export class ExpenseClaimRepository {
  async findById(id: string, organizationId: string) {
    return prisma.expenseClaim.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        auditLogs: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findByOrganization(organizationId: string) {
    return prisma.expenseClaim.findMany({
      where: {
        organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        auditLogs: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByCreatedBy(createdById: string, organizationId: string) {
    return prisma.expenseClaim.findMany({
      where: {
        createdById,
        organizationId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        auditLogs: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createClaim(data: {
    organizationId: string;
    createdById: string;
    amount: number;
    category: string;
    description: string;
  }) {
    return prisma.expenseClaim.create({
      data: {
        organizationId: data.organizationId,
        createdById: data.createdById,
        amount: data.amount,
        category: data.category,
        description: data.description,
        status: Status.DRAFT,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        auditLogs: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async updateClaim(
    id: string,
    data: {
      amount?: number;
      category?: string;
      description?: string;
      status?: Status;
    }
  ) {
    return prisma.expenseClaim.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        auditLogs: {
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async deleteClaim(id: string): Promise<void> {
    await prisma.expenseClaim.delete({
      where: { id },
    });
  }
}
