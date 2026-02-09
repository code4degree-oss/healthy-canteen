import express from 'express';
import { pauseSubscription, cancelSubscription } from '../controllers/subscriptionController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken); // Protect all routes

router.post('/pause', pauseSubscription);
router.post('/cancel', cancelSubscription);

export default router;
