import { PrismaClient } from '@prisma/client';
import { Role, Status } from '../types/constants';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database state...');
  
  const orgCount = await prisma.organization.count();
  if (orgCount > 0) {
    console.log('Database already contains data. Skipping seeding.');
    return;
  }

  console.log('Database is empty. Seeding database...');

  // Clean existing data just in case
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.expenseClaim.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Acme Technologies
  const acme = await prisma.organization.create({
    data: { name: 'Acme Technologies' },
  });

  const acmeEmp1 = await prisma.user.create({
    data: { name: 'John Doe', email: 'john@acme.com', passwordHash, role: Role.EMPLOYEE, organizationId: acme.id },
  });
  const acmeEmp2 = await prisma.user.create({
    data: { name: 'Alice Smith', email: 'alice@acme.com', passwordHash, role: Role.EMPLOYEE, organizationId: acme.id },
  });
  const acmeMgr1 = await prisma.user.create({
    data: { name: 'Bob Jones', email: 'bob@acme.com', passwordHash, role: Role.MANAGER, organizationId: acme.id },
  });
  const acmeMgr2 = await prisma.user.create({
    data: { name: 'Charlie Brown', email: 'charlie@acme.com', passwordHash, role: Role.MANAGER, organizationId: acme.id },
  });
  const acmeFin = await prisma.user.create({
    data: { name: 'David Miller', email: 'david@acme.com', passwordHash, role: Role.FINANCE, organizationId: acme.id },
  });

  // 2. Create Globex Solutions
  const globex = await prisma.organization.create({
    data: { name: 'Globex Solutions' },
  });

  const globexEmp1 = await prisma.user.create({
    data: { name: 'Jane Doe', email: 'jane@globex.com', passwordHash, role: Role.EMPLOYEE, organizationId: globex.id },
  });
  const globexEmp2 = await prisma.user.create({
    data: { name: 'Eve White', email: 'eve@globex.com', passwordHash, role: Role.EMPLOYEE, organizationId: globex.id },
  });
  const globexMgr1 = await prisma.user.create({
    data: { name: 'Frank Harris', email: 'frank@globex.com', passwordHash, role: Role.MANAGER, organizationId: globex.id },
  });
  const globexMgr2 = await prisma.user.create({
    data: { name: 'Grace Kelly', email: 'grace@globex.com', passwordHash, role: Role.MANAGER, organizationId: globex.id },
  });
  const globexFin = await prisma.user.create({
    data: { name: 'Henry Ford', email: 'henry@globex.com', passwordHash, role: Role.FINANCE, organizationId: globex.id },
  });

  console.log('Users seeded successfully!');

  // Seed claims for Acme
  // Draft
  const c1 = await prisma.expenseClaim.create({
    data: {
      organizationId: acme.id,
      createdById: acmeEmp1.id,
      amount: 150.00,
      category: 'Travel',
      description: 'Taxi ride to client site',
      status: Status.DRAFT,
    },
  });

  // Submitted
  const c2 = await prisma.expenseClaim.create({
    data: {
      organizationId: acme.id,
      createdById: acmeEmp1.id,
      amount: 85.50,
      category: 'Meals',
      description: 'Dinner with client',
      status: Status.SUBMITTED,
    },
  });
  await prisma.auditLog.create({
    data: {
      claimId: c2.id,
      changedById: acmeEmp1.id,
      fromStatus: Status.DRAFT,
      toStatus: Status.SUBMITTED,
      note: 'Submitting claim for approval.',
    },
  });

  // Approved
  const c3 = await prisma.expenseClaim.create({
    data: {
      organizationId: acme.id,
      createdById: acmeEmp2.id,
      amount: 450.00,
      category: 'Equipment',
      description: 'External monitor for home office',
      status: Status.APPROVED,
    },
  });
  await prisma.auditLog.createMany({
    data: [
      {
        claimId: c3.id,
        changedById: acmeEmp2.id,
        fromStatus: Status.DRAFT,
        toStatus: Status.SUBMITTED,
        note: 'Submitted',
      },
      {
        claimId: c3.id,
        changedById: acmeMgr1.id,
        fromStatus: Status.SUBMITTED,
        toStatus: Status.APPROVED,
        note: 'Looks good, approved.',
      },
    ],
  });

  // Rejected
  const c4 = await prisma.expenseClaim.create({
    data: {
      organizationId: acme.id,
      createdById: acmeEmp1.id,
      amount: 1200.00,
      category: 'Other',
      description: 'Personal flight ticket mistakenly charged',
      status: Status.REJECTED,
    },
  });
  await prisma.auditLog.createMany({
    data: [
      {
        claimId: c4.id,
        changedById: acmeEmp1.id,
        fromStatus: Status.DRAFT,
        toStatus: Status.SUBMITTED,
        note: 'Submitted',
      },
      {
        claimId: c4.id,
        changedById: acmeMgr2.id,
        fromStatus: Status.SUBMITTED,
        toStatus: Status.REJECTED,
        note: 'Personal expenses are not covered.',
      },
    ],
  });

  // Paid
  const c5 = await prisma.expenseClaim.create({
    data: {
      organizationId: acme.id,
      createdById: acmeEmp2.id,
      amount: 75.00,
      category: 'Software',
      description: 'Monthly SaaS subscription fee',
      status: Status.PAID,
    },
  });
  await prisma.auditLog.createMany({
    data: [
      {
        claimId: c5.id,
        changedById: acmeEmp2.id,
        fromStatus: Status.DRAFT,
        toStatus: Status.SUBMITTED,
        note: 'Submitted',
      },
      {
        claimId: c5.id,
        changedById: acmeMgr1.id,
        fromStatus: Status.SUBMITTED,
        toStatus: Status.APPROVED,
        note: 'Approved SaaS tool.',
      },
      {
        claimId: c5.id,
        changedById: acmeFin.id,
        fromStatus: Status.APPROVED,
        toStatus: Status.PAID,
        note: 'Payment processed.',
      },
    ],
  });

  // Seed claims for Globex
  // Submitted claim in Globex
  const gc1 = await prisma.expenseClaim.create({
    data: {
      organizationId: globex.id,
      createdById: globexEmp1.id,
      amount: 320.00,
      category: 'Travel',
      description: 'Hotel booking for conference',
      status: Status.SUBMITTED,
    },
  });
  await prisma.auditLog.create({
    data: {
      claimId: gc1.id,
      changedById: globexEmp1.id,
      fromStatus: Status.DRAFT,
      toStatus: Status.SUBMITTED,
      note: 'Submitting conference accommodation',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
