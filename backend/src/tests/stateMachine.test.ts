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

  it('should test "Send Back for Revision" workflow and constraints', async () => {
    // 1. Create a claim
    const createRes = await app.inject({
      method: 'POST',
      url: '/claims',
      headers: { cookie: empCookie },
      payload: { amount: 150, category: 'Meals', description: 'Business Dinner' },
    });
    const claimId = JSON.parse(createRes.body).claim.id;

    // Submit and Approve
    await app.inject({ method: 'POST', url: `/claims/${claimId}/submit`, headers: { cookie: empCookie } });
    await app.inject({ method: 'POST', url: `/claims/${claimId}/approve`, headers: { cookie: mgrCookie } });

    // 2. FINANCE receives 403 when trying to send back
    const finSendRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/send-back`,
      headers: { cookie: finCookie },
      payload: { reason: 'Wrong role sending back' },
    });
    expect(finSendRes.statusCode).toBe(403);

    // 3. EMPLOYEE receives 403 when trying to send back
    const empSendRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/send-back`,
      headers: { cookie: empCookie },
      payload: { reason: 'Employee sending back own' },
    });
    expect(empSendRes.statusCode).toBe(403);

    // 4. Cannot send back another organization\'s claim
    const otherMgrCookie = await getAuthCookie(app, 'mgrB@test.com');
    const otherSendRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/send-back`,
      headers: { cookie: otherMgrCookie },
      payload: { reason: 'Cross organization send back reason' },
    });
    expect(otherSendRes.statusCode).toBe(404);

    // 5. Manager successfully sends back APPROVED claim (reason too short)
    const tooShortRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/send-back`,
      headers: { cookie: mgrCookie },
      payload: { reason: 'Short' },
    });
    expect(tooShortRes.statusCode).toBe(400);

    // Now success send back
    const sendBackRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/send-back`,
      headers: { cookie: mgrCookie },
      payload: { reason: 'Approved by mistake. Please attach the missing hotel invoice.' },
    });
    expect(sendBackRes.statusCode).toBe(200);
    expect(JSON.parse(sendBackRes.body).claim.status).toBe('DRAFT');

    // 6. Employee can edit returned claim
    const editRes = await app.inject({
      method: 'PATCH',
      url: `/claims/${claimId}`,
      headers: { cookie: empCookie },
      payload: { amount: 140, category: 'Meals', description: 'Updated Business Dinner' },
    });
    expect(editRes.statusCode).toBe(200);
    expect(Number(JSON.parse(editRes.body).claim.amount)).toBe(140);

    // 7. Employee can resubmit returned claim
    const resubmitRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/submit`,
      headers: { cookie: empCookie },
    });
    expect(resubmitRes.statusCode).toBe(200);
    expect(JSON.parse(resubmitRes.body).claim.status).toBe('SUBMITTED');

    // Approve again to test PAID cannot be sent back
    await app.inject({ method: 'POST', url: `/claims/${claimId}/approve`, headers: { cookie: mgrCookie } });
    await app.inject({ method: 'POST', url: `/claims/${claimId}/mark-paid`, headers: { cookie: finCookie } });

    // 8. Cannot send back PAID claim
    const paidSendRes = await app.inject({
      method: 'POST',
      url: `/claims/${claimId}/send-back`,
      headers: { cookie: mgrCookie },
      payload: { reason: 'Try to send back paid claim' },
    });
    expect(paidSendRes.statusCode).toBe(409);

    // 9. Fetch details and verify Audit log entry is created
    const detailsRes = await app.inject({
      method: 'GET',
      url: `/claims/${claimId}`,
      headers: { cookie: empCookie },
    });
    const claim = JSON.parse(detailsRes.body).claim;
    const sendBackLog = claim.auditLogs.find((l: any) => l.fromStatus === 'APPROVED' && l.toStatus === 'DRAFT');
    expect(sendBackLog).toBeDefined();
    expect(sendBackLog.note).toBe('Approved by mistake. Please attach the missing hotel invoice.');
  });
});
