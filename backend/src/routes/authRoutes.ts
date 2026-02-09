import express from 'express';
import { login, register, googleLogin, verifyToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/verify', authenticateToken, verifyToken);

export default router;
