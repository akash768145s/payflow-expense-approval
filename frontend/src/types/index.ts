export type Role = 'EMPLOYEE' | 'MANAGER' | 'FINANCE';

export type Status = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
  organizationName?: string;
}

export interface AuditLog {
  id: string;
  claimId: string;
  changedById: string;
  changedBy: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  fromStatus: Status;
  toStatus: Status;
  note: string | null;
  createdAt: string;
}

export interface ExpenseClaim {
  id: string;
  organizationId: string;
  createdById: string;
  amount: string; // Prisma Decimals are serialized as strings in JSON
  category: string;
  description: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  auditLogs?: AuditLog[];
}
