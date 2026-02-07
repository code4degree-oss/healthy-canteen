import express from 'express';
import { login, register, googleLogin } from '../controllers/authController';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);

export default router;
