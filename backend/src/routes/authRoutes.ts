import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, googleLogin, verifyToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Rate limit: max 10 login/register attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', googleLogin);
router.get('/verify', authenticateToken, verifyToken);

export default router;
