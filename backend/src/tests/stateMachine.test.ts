import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import { resetDatabase, seedTestData, getAuthCookie } from './helpers';

describe('State Machine & Auditing API', () => {
  const app = buildApp();
  let empCookie: string;
  let mgrCookie: string;
  let finCookie: string;

  beforeAll(async () => {
    await app.ready();
    await resetDatabase();
    await seedTestData();
    empCookie = await getAuthCookie(app, 'empA@test.com');
    mgrCookie = await getAuthCookie(app, 'mgrA@test.com');
    finCookie = await getAuthCookie(app, 'finA@test.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should transition claim: DRAFT -> SUBMITTED -> APPROVED -> PAID successfully', async () => {
    // 1. Create DRAFT claim
    const createRes = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: { amount: 100, category: 'Hardware', description: 'Keyboard' },
    });
    const claimId = JSON.parse(createRes.body).claim.id;

    // 2. Submit: DRAFT -> SUBMITTED
    const submitRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/submit`,
      headers: { cookie: empCookie },
      payload: { note: 'Submitting keyboard expense' },
    });
    expect(submitRes.statusCode).toBe(200);
    expect(JSON.parse(submitRes.body).claim.status).toBe('SUBMITTED');

    // 3. Approve: SUBMITTED -> APPROVED
    const approveRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/approve`,
      headers: { cookie: mgrCookie },
      payload: { note: 'Approve hardware request' },
    });
    expect(approveRes.statusCode).toBe(200);
    expect(JSON.parse(approveRes.body).claim.status).toBe('APPROVED');

    // 4. Pay: APPROVED -> PAID
    const payRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/mark-paid`,
      headers: { cookie: finCookie },
      payload: { note: 'Payment disbursed' },
    });
    expect(payRes.statusCode).toBe(200);
    expect(JSON.parse(payRes.body).claim.status).toBe('PAID');

    // 5. Fetch details and verify Audit logs
    const detailsRes = await app.inject({
      method: 'GET',
      url: `/claims/${claimId}`,
      headers: { cookie: empCookie },
    });
    const claim = JSON.parse(detailsRes.body).claim;
    expect(claim.auditLogs.length).toBe(3);
    expect(claim.auditLogs[0].toStatus).toBe('PAID');
    expect(claim.auditLogs[1].toStatus).toBe('APPROVED');
    expect(claim.auditLogs[2].toStatus).toBe('SUBMITTED');
  });

  it('should block invalid transition: DRAFT -> APPROVED directly with 409', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: { amount: 50, category: 'Hardware', description: 'Mouse' },
    });
    const claimId = JSON.parse(createRes.body).claim.id;

    const approveRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/approve`,
      headers: { cookie: mgrCookie },
      payload: { note: 'Try direct approval' },
    });
    expect(approveRes.statusCode).toBe(409);
    expect(JSON.parse(approveRes.body).error).toBe('ConflictError');
  });

  it('should block invalid transition: PAID -> APPROVED with 409', async () => {
    // We already have a paid claim from the first test, but let's make a new one to be clean
    const createRes = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: { amount: 30, category: 'Hardware', description: 'Cable' },
    });
    const claimId = JSON.parse(createRes.body).claim.id;

    await app.inject({ method: 'POST', url: `/claims/${claimId}/submit`, headers: { cookie: empCookie } });
    await app.inject({ method: 'POST', url: `/claims/${claimId}/approve`, headers: { cookie: mgrCookie } });
    await app.inject({ method: 'POST', url: `/claims/${claimId}/mark-paid`, headers: { cookie: finCookie } });

    // Now try to approve it again
    const reApproveRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/approve`,
      headers: { cookie: mgrCookie },
    });
    expect(reApproveRes.statusCode).toBe(409);
  });

  it('should block invalid transition: REJECTED -> APPROVED with 409', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: { amount: 200, category: 'Meals', description: 'Lunch' },
    });
    const claimId = JSON.parse(createRes.body).claim.id;

    await app.inject({ method: 'POST', url: `/claims/${claimId}/submit`, headers: { cookie: empCookie } });
    
    // Reject it
    await app.inject({ method: 'POST', url: `/claims/${claimId}/reject`, headers: { cookie: mgrCookie } });

    // Try to approve it
    const approveRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/approve`,
      headers: { cookie: mgrCookie },
    });
    expect(approveRes.statusCode).toBe(409);
  });
});
