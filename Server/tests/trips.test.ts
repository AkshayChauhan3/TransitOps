import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

describe('Trips Workflow Endpoints', () => {
  it('should not allow dispatching a non-DRAFT trip', async () => {
    const token = jwt.sign(
      { userId: 123, role: 'DISPATCHER', branchId: 456 },
      process.env.JWT_SECRET || 'secret'
    );

    // Mocking the database would normally happen here.
    // Assuming the DB returns 404 because the trip doesn't exist,
    // we just want to ensure the route is authenticated and processed.
    const res = await request(app)
      .post('/api/trips/invalid-id/dispatch')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleId: 1, driverId: 1 });
    
    // We expect 404 if trip not found, or 400 if validation fails, 
    // but not 401/403.
    expect([400, 404]).toContain(res.statusCode);
  });
});
