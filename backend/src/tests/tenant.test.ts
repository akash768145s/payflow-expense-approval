import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import { resetDatabase, seedTestData, getAuthCookie } from './helpers';
import { prisma } from '../lib/prisma';
import { Status, Role } from '../types/constants';

describe('Tenant Isolation & Role Permissions API', () => {
  const app = buildApp();
  // Org A cookies
  let empACookie: string;
  let mgrACookie: string;
  let finACookie: string;

  // Org B cookies
  let empBCookie: string;
  let mgrBCookie: string;

  let testContext: any;

  beforeAll(async () => {
    await app.ready();
    await resetDatabase();
    testContext = await seedTestData();
    
    empACookie = await getAuthCookie(app, 'empA@test.com');
    mgrACookie = await getAuthCookie(app, 'mgrA@test.com');
    finACookie = await getAuthCookie(app, 'finA@test.com');

    empBCookie = await getAuthCookie(app, 'empB@test.com');
    mgrBCookie = await getAuthCookie(app, 'mgrB@test.com');
  });

  afterAll(async () => {
    await app.close();
  });

  // 1. Tenant Isolation tests
  it('should return 404 (not 403) when Org B Employee tries to fetch Org A claim', async () => {
    // Create claim in Org A
    const claimA = await prisma.expenseClaim.create({
      data: {
        organizationId: testContext.orgA.id,
        createdById: testContext.empA.id,
        amount: 250,
        category: 'Travel',
        description: 'Org A train ticket',
        status: Status.SUBMITTED,
      },
    });

    // Try fetching it as Org B Employee
    const response = await app.inject({
      method: 'GET',
      url: `/claims/${claimA.id}`,
      headers: { cookie: empBCookie },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should return 404 when Org B Manager tries to approve Org A claim', async () => {
    const claimA = await prisma.expenseClaim.create({
      data: {
        organizationId: testContext.orgA.id,
        createdById: testContext.empA.id,
        amount: 300,
        category: 'Software',
        description: 'Org A Software license',
        status: Status.SUBMITTED,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/claims/${claimA.id}/approve`,
      headers: { cookie: mgrBCookie },
    });

    expect(response.statusCode).toBe(404);
  });

  // 2. Role Permission checks
  it('should block Employees from approving claims with 403', async () => {
    const claim = await prisma.expenseClaim.create({
      data: {
        organizationId: testContext.orgA.id,
        createdById: testContext.empA.id,
        amount: 45,
        category: 'Meals',
        description: 'Snacks',
        status: Status.SUBMITTED,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/claims/${claim.id}/approve`,
      headers: { cookie: empACookie },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should block Finance users from approving claims with 403', async () => {
    const claim = await prisma.expenseClaim.create({
      data: {
        organizationId: testContext.orgA.id,
        createdById: testContext.empA.id,
        amount: 45,
        category: 'Meals',
        description: 'Snacks',
        status: Status.SUBMITTED,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/claims/${claim.id}/approve`,
      headers: { cookie: finACookie },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should block Managers from marking claims paid with 403', async () => {
    const claim = await prisma.expenseClaim.create({
      data: {
        organizationId: testContext.orgA.id,
        createdById: testContext.empA.id,
        amount: 80,
        category: 'Travel',
        description: 'Cab',
        status: Status.APPROVED,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/claims/${claim.id}/mark-paid`,
      headers: { cookie: mgrACookie },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should block Managers from approving their own claims with 403', async () => {
    // Create a user that is a manager, but let's simulate them having a claim (e.g. submitted prior to promotion or seeded)
    const claim = await prisma.expenseClaim.create({
      data: {
        organizationId: testContext.orgA.id,
        createdById: testContext.mgrA.id, // claim created by the manager themselves
        amount: 500,
        category: 'Hardware',
        description: 'New iPad',
        status: Status.SUBMITTED,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/claims/${claim.id}/approve`,
      headers: { cookie: mgrACookie }, // same manager tries to approve it
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('Managers cannot approve their own expense claims');
  });
});
