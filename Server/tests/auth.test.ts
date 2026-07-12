import request from 'supertest';
import app from '../src/app';

describe('Auth Endpoints', () => {
  it('should return 401 for invalid login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });
    expect(res.statusCode).toEqual(401);
  });
});
