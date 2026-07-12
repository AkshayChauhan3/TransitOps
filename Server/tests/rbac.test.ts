import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

describe('RBAC Middleware', () => {
  it('should deny DISPATCHER access to financial reports', async () => {
    const token = jwt.sign(
      { userId: 123, role: 'DISPATCHER', branchId: 456 },
      process.env.JWT_SECRET || 'secret'
    );

    const res = await request(app)
      .get('/api/reports/roi')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(403);
  });

  it('should allow BRANCH_ADMIN access to trips', async () => {
    const token = jwt.sign(
      { userId: 123, role: 'BRANCH_ADMIN', branchId: 456 },
      process.env.JWT_SECRET || 'secret'
    );

    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).not.toEqual(403);
  });
});
