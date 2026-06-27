import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import { resetDatabase, seedTestData, getAuthCookie } from './helpers';

describe('Expense Claims API CRUD', () => {
  const app = buildApp();
  let empCookie: string;
  let mgrCookie: string;

  beforeAll(async () => {
    await app.ready();
    await resetDatabase();
    await seedTestData();
    empCookie = await getAuthCookie(app, 'empA@test.com');
    mgrCookie = await getAuthCookie(app, 'mgrA@test.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow employee to create a valid claim', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: {
        amount: 120.50,
        category: 'Travel',
        description: 'Client meeting train ticket',
      },
    });

    expect(response.statusCode).toBe(210);
    const body = JSON.parse(response.body);
    expect(body.claim).toBeDefined();
    expect(Number(body.claim.amount)).toBe(120.50);
    expect(body.claim.status).toBe('DRAFT');
  });

  it('should reject claim creation with amount <= 0', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: {
        amount: -5.00,
        category: 'Meals',
        description: 'Negative expense',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject claim creation with missing category', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: {
        amount: 20.00,
        description: 'No category',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should prevent managers from creating claims', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: mgrCookie },
      payload: {
        amount: 100.00,
        category: 'Software',
        description: 'SaaS Tool',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should allow employees to update draft claims', async () => {
    // 1. Create a claim
    const createRes = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: {
        amount: 50.00,
        category: 'Office',
        description: 'Stationery',
      },
    });
    const claimId = JSON.parse(createRes.body).claim.id;

    // 2. Update it
    const updateRes = await app.inject({
      method: 'PATCH',
      url: `/claims/${claimId}`,
      headers: { cookie: empCookie },
      payload: {
        amount: 55.00,
        description: 'Stationery and printing paper',
      },
    });

    expect(updateRes.statusCode).toBe(200);
    const body = JSON.parse(updateRes.body);
    expect(Number(body.claim.amount)).toBe(55.00);
    expect(body.claim.description).toBe('Stationery and printing paper');
  });

  it('should allow employees to delete draft claims', async () => {
    // 1. Create a claim
    const createRes = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: {
        amount: 15.00,
        category: 'Postage',
        description: 'Stamps',
      },
    });
    const claimId = JSON.parse(createRes.body).claim.id;

    // 2. Delete it
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/claims/${claimId}`,
      headers: { cookie: empCookie },
    });
    expect(deleteRes.statusCode).toBe(200);

    // 3. Confirm it's gone
    const getRes = await app.inject({
      method: 'GET',
      url: `/claims/${claimId}`,
      headers: { cookie: empCookie },
    });
    expect(getRes.statusCode).toBe(404);
  });
});
