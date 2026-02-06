import express from 'express';
import { createOrder, getUserOrders, getActiveSubscription } from '../controllers/orderController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken); // Protect all order routes

router.post('/', createOrder);
router.get('/', getUserOrders);
router.get('/active', getActiveSubscription);

export default router;
