import express from 'express';
import { getMenu, createPlan, createMenuItem, updateMenuItem, deleteMenuItem, deletePlan, upload } from '../controllers/menuController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = express.Router();

// Public
router.get('/', getMenu);

// Admin Only
router.post('/plans', authenticateToken, authorizeRole(['admin']), createPlan);
router.delete('/plans/:id', authenticateToken, authorizeRole(['admin']), deletePlan);
router.post('/items', authenticateToken, authorizeRole(['admin']), upload.single('image'), createMenuItem);
router.put('/items/:id', authenticateToken, authorizeRole(['admin']), updateMenuItem);
router.delete('/items/:id', authenticateToken, authorizeRole(['admin']), deleteMenuItem);

export default router;

