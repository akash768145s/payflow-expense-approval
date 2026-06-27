import { PrismaClient } from '@prisma/client';
import { Role, Status } from '../types/constants';
import * as bcrypt from 'bcrypt';
import { FastifyInstance } from 'fastify';

const prisma = new PrismaClient();

export async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.expenseClaim.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

export async function seedTestData() {
  const passwordHash = await bcrypt.hash('password123', 1); // low salt rounds for fast tests

  // Org A
  const orgA = await prisma.organization.create({
    data: { name: 'Org A' },
  });

  const empA = await prisma.user.create({
    data: { name: 'Emp A', email: 'empA@test.com', passwordHash, role: Role.EMPLOYEE, organizationId: orgA.id },
  });
  const mgrA = await prisma.user.create({
    data: { name: 'Mgr A', email: 'mgrA@test.com', passwordHash, role: Role.MANAGER, organizationId: orgA.id },
  });
  const finA = await prisma.user.create({
    data: { name: 'Fin A', email: 'finA@test.com', passwordHash, role: Role.FINANCE, organizationId: orgA.id },
  });

  // Org B
  const orgB = await prisma.organization.create({
    data: { name: 'Org B' },
  });

  const empB = await prisma.user.create({
    data: { name: 'Emp B', email: 'empB@test.com', passwordHash, role: Role.EMPLOYEE, organizationId: orgB.id },
  });
  const mgrB = await prisma.user.create({
    data: { name: 'Mgr B', email: 'mgrB@test.com', passwordHash, role: Role.MANAGER, organizationId: orgB.id },
  });
  const finB = await prisma.user.create({
    data: { name: 'Fin B', email: 'finB@test.com', passwordHash, role: Role.FINANCE, organizationId: orgB.id },
  });

  return {
    orgA,
    empA,
    mgrA,
    finA,
    orgB,
    empB,
    mgrB,
    finB,
  };
}

export async function getAuthCookie(app: FastifyInstance, email: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email,
      password: 'password123',
    },
  });

  const cookies = response.cookies;
  const sessionCookie = cookies.find((c) => c.name === 'session');
  if (!sessionCookie) {
    throw new Error(`Failed to log in for ${email}`);
  }

  return `session=${sessionCookie.value}`;
}
