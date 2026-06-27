export const Role = {
  EMPLOYEE: 'EMPLOYEE' as const,
  MANAGER: 'MANAGER' as const,
  FINANCE: 'FINANCE' as const,
} as const;

export type Role = typeof Role[keyof typeof Role];

export const Status = {
  DRAFT: 'DRAFT' as const,
  SUBMITTED: 'SUBMITTED' as const,
  APPROVED: 'APPROVED' as const,
  REJECTED: 'REJECTED' as const,
  PAID: 'PAID' as const,
} as const;

export type Status = typeof Status[keyof typeof Status];
