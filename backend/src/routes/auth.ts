import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { loginSchema, refreshTokenSchema } from '../types';

const router = Router();

// Helper to generate tokens
const generateTokens = (userId: string, role: string) => {
  const accessSecret = process.env.JWT_SECRET || 'fallback_secret_for_dev';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev';

  const accessToken = jwt.sign({ userId, role }, accessSecret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, role }, refreshSecret, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    // 1. Check if account is currently locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ error: { code: 'ACCOUNT_LOCKED', message: 'Account locked after 5 failed attempts. Try again later.' } });
    }

    // 2. Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValid) {
      // 3. Handle failed attempt and possible lockout
      const newAttempts = user.failedLoginAttempts + 1;
      let lockedUntil = null;
      
      if (newAttempts >= 5) {
        const lockMinutes = parseInt(process.env.LOGIN_LOCK_MINUTES || '30');
        lockedUntil = new Date(Date.now() + lockMinutes * 60000);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newAttempts, lockedUntil }
      });

      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    // 4. Success: Reset attempts and generate tokens
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null }
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);

    // Save refresh token to DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, role: user.role } });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_for_dev';

    // Verify token exists and is not revoked in DB
    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired refresh token' } });
    }

    // Verify cryptographic validity
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string, role: string };
    } catch (err) {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid token signature' } });
    }

    // Rotate token (revoke old, issue new)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    const tokens = generateTokens(decoded.userId, decoded.role);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: decoded.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (error) {
    next(error);
  }
});

export default router;
