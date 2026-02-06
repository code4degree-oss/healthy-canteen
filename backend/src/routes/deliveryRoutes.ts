import express from 'express';
import { getDeliveryQueue } from '../controllers/deliveryController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Should be protected, ideally check for 'delivery' role too, but auth is enough for now
router.get('/queue', authenticateToken, getDeliveryQueue);

export default router;
