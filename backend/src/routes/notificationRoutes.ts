import express from 'express';
import { getNotifications, markAsRead, deleteNotification, broadcastNotification, getSentNotifications } from '../controllers/notificationController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Admin only routes
router.post('/broadcast', authorizeRole(['admin']), broadcastNotification);
router.get('/sent', authorizeRole(['admin']), getSentNotifications);

export default router;
