import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../app';
import { resetDatabase, seedTestData, getAuthCookie } from './helpers';

describe('Authentication API', () => {
  const app = buildApp();

  beforeAll(async () => {
    await app.ready();
    await resetDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 for unauthorized GET /auth/me', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });
    expect(response.statusCode).toBe(401);
  });

  it('should successfully log in and set HttpOnly session cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'empA@test.com',
        password: 'password123',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('empA@test.com');
    expect(body.user.role).toBe('EMPLOYEE');

    const sessionCookie = response.cookies.find(c => c.name === 'session');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
  });

  it('should reject invalid credentials with 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'empA@test.com',
        password: 'wrongpassword',
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('UnauthorizedError');
  });

  it('should get authenticated user details using cookie', async () => {
    const cookie = await getAuthCookie(app, 'empA@test.com');

    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        cookie,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.email).toBe('empA@test.com');
  });

  it('should successfully log out and clear cookie', async () => {
    const cookie = await getAuthCookie(app, 'empA@test.com');

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        cookie,
      },
    });

    expect(logoutResponse.statusCode).toBe(200);

    const clearedCookie = logoutResponse.cookies.find(c => c.name === 'session');
    // Fastify cookie clearing sets expires to a past date
    expect(clearedCookie?.value).toBe('');

    // subsequent GET /auth/me should fail
    const meResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        cookie, // using the old session cookie
      },
    });
    expect(meResponse.statusCode).toBe(401);
  });
});
