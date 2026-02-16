import express from 'express';
import * as deliveryController from '../controllers/deliveryController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// Should be protected, ideally check for 'delivery' role too, but auth is enough for now
router.get('/queue', authenticateToken, authorizeRole(['admin', 'delivery']), deliveryController.getDeliveryQueue);
router.get('/history', authenticateToken, authorizeRole(['admin', 'delivery']), deliveryController.getDeliveryHistory);
router.post('/confirm', authenticateToken, authorizeRole(['admin', 'delivery']), deliveryController.confirmDelivery);
router.post('/no-receive', authenticateToken, authorizeRole(['admin', 'delivery']), deliveryController.markNoReceive);

export default router;
