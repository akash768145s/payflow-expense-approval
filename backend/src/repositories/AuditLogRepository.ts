import { prisma } from '../lib/prisma';
import { AuditLog } from '@prisma/client';
import { Status } from '../types/constants';

export class AuditLogRepository {
  async createLog(data: {
    claimId: string;
    changedById: string;
    fromStatus: Status;
    toStatus: Status;
    note?: string | null;
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        claimId: data.claimId,
        changedById: data.changedById,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        note: data.note || null,
      },
    });
  }

  async findByClaimId(claimId: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { claimId },
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
    });
  }
}
