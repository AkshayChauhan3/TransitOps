import { Router } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validate } from '../middleware/validate';
import { loginSchema, refreshTokenSchema } from '../types';

const router = Router();

// Configurable lockout from env, default 30 mins
const LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCK_MINUTES || 30);

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // 1. Check if user exists and is not soft-deleted
    if (!user || user.deletedAt !== null) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    // 2. Check if locked out
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ error: { code: 'ACCOUNT_LOCKED', message: 'Account is locked due to too many failed attempts' } });
    }

    // 3. Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: newAttempts };
      
      if (newAttempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }
      
      await prisma.user.update({ where: { id: user.id }, data: updates });
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    // 4. Success - reset lockouts
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null }
    });

    // 5. Generate tokens (NOW INCLUDING BRANCH ID)
    const payload = { userId: user.id, role: user.role, branchId: user.branchId };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'r_secret', { expiresIn: '7d' });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken, // ideally hashed in DB in production
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    const { passwordHash, ...safeUser } = user;
    res.json({ accessToken, refreshToken, user: safeUser });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify token exists and is valid in DB
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!dbToken || dbToken.revokedAt || dbToken.expiresAt < new Date() || dbToken.deletedAt !== null) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } });
    }

    // Verify JWT signature
    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'r_secret');
    } catch {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token expired or invalid' } });
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revokedAt: new Date() }
    });

    // Issue new tokens (INCLUDING BRANCH ID)
    const payload = { userId: dbToken.user.id, role: dbToken.user.role, branchId: dbToken.user.branchId };
    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    const newRefreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'r_secret', { expiresIn: '7d' });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: dbToken.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() }
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
