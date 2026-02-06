import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    getAllUsers, createUser, deleteUser,
    getMenu, addMenuItem, updateMenuItem, deleteMenuItem,
    getAddOns, addAddOn, deleteAddOn
} from '../controllers/adminController';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

// Protect all routes
router.use(authenticateToken);
// router.use(isAdmin); // Enable specifically for admin actions, but for now we might want public read access for Menu? 
// No, this is ADMIN routes. Public reads will go through public routes if needed. 
// actually getMenu/getAddOns should be public for client execution? 
// Let's make specific public routes or keep them here but public.
// Better: Keep Admin management here. Public fetching -> Separate or open.
// For simplicity: Admin routes are for MANIPULATION. 
// FETCHING might need to be open.
// Let's stick to: Users need Admin. Menu Modification needs Admin.

// USERS
router.get('/users', isAdmin, getAllUsers);
router.post('/users', isAdmin, createUser);
router.delete('/users/:id', isAdmin, deleteUser);

// MENU (Public READ, Admin WRITE)
router.get('/menu', getMenu); // Anyone can read menu
router.post('/menu', isAdmin, addMenuItem);
router.put('/menu/:id', isAdmin, updateMenuItem);
router.delete('/menu/:id', isAdmin, deleteMenuItem);

// ADD-ONS (Public READ, Admin WRITE)
router.get('/addons', getAddOns); // Anyone can read addons
router.post('/addons', isAdmin, addAddOn);
router.delete('/addons/:id', isAdmin, deleteAddOn);

export default router;
