import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';
import MenuItem from '../models/MenuItem';
import AddOn from '../models/AddOn';
import Order from '../models/Order';
import Subscription from '../models/Subscription';
import bcrypt from 'bcryptjs';

import DeliveryLog from '../models/DeliveryLog';
import Notification from '../models/Notification';

// --- USERS ---

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;
        const search = (req.query.search as string) || '';

        const whereClause = search ? {
            [Op.or]: [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ]
        } : {};

        const { count, rows } = await User.findAndCountAll({
            where: whereClause,
            attributes: ['id', 'name', 'email', 'role', 'createdAt'],
            include: [
                {
                    model: Order,
                    as: 'orders',
                    attributes: ['id', 'totalPrice', 'createdAt', 'days', 'mealsPerDay']
                },
                {
                    model: Subscription,
                    as: 'subscriptions',
                    attributes: ['id', 'status', 'protein', 'mealsPerDay', 'daysRemaining', 'deliveryAddress', 'addons'],
                    include: [{
                        model: DeliveryLog,
                        as: 'deliveryLogs',
                        attributes: ['id', 'status', 'deliveryTime', 'userId'],
                        include: [{ model: User, as: 'deliveryAgent', attributes: ['id', 'name'] }]
                    }]
                }
            ],
            limit,
            offset,
            distinct: true, // Ensure correct count with includes
            order: [['createdAt', 'DESC']]
        });

        res.json({
            users: rows,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await User.destroy({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword, role: role || 'user' });
        res.status(201).json({ message: 'User created', user });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
};

// --- MENU ---

export const getMenu = async (req: Request, res: Response) => {
    try {
        const menu = await MenuItem.findAll();
        res.json(menu);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu', error });
    }
};

export const addMenuItem = async (req: Request, res: Response) => {
    try {
        const item = await MenuItem.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error adding menu item', error });
    }
};

export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await MenuItem.update(req.body, { where: { id } });
        res.json({ message: 'Menu item updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating menu item', error });
    }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await MenuItem.destroy({ where: { id } });
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item', error });
    }
};

// --- ADD ONS ---

export const getAddOns = async (req: Request, res: Response) => {
    try {
        const addons = await AddOn.findAll();
        res.json(addons);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching addons', error });
    }
};

export const addAddOn = async (req: Request, res: Response) => {
    try {
        const { name, price, description, allowSubscription } = req.body;

        let image = null;
        let thumbnail = null;

        if (req.file) {
            // Process single file using utility (wrap in array)
            // Note: 'req.file' comes from single() upload, but our utility expects array if reusing 'processUploadedImages'. 
            // Or we can manually process. 
            // Since 'processUploadedImages' accepts array, let's cast 'req.file' to array.
            const files = [req.file];
            const processed = await import('../utils/fileUpload').then(m => m.processUploadedImages(files, m.UploadFolder.ADDONS));
            if (processed.length > 0) {
                image = `/uploads${processed[0].original}`;
                thumbnail = `/uploads${processed[0].thumbnail}`;
            }
        }

        const addon = await AddOn.create({
            name,
            price,
            description,
            allowSubscription: allowSubscription === 'true' || allowSubscription === true,
            image,
            thumbnail
        });
        res.status(201).json(addon);
    } catch (error) {
        console.error("Error adding addon:", error);
        res.status(500).json({ message: 'Error adding addon', error });
    }
};

export const deleteAddOn = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await AddOn.destroy({ where: { id } });
        res.json({ message: 'Addon deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting addon', error });
    }
};

export const updateAddOn = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, price, description, allowSubscription } = req.body;

        const addon = await AddOn.findByPk(id);
        if (!addon) return res.status(404).json({ message: 'Addon not found' });

        if (name) addon.name = name;
        if (price) addon.price = price;
        if (description) addon.description = description;
        if (allowSubscription !== undefined) {
            addon.allowSubscription = allowSubscription === 'true' || allowSubscription === true;
        }

        if (req.file) {
            // Process single file
            const files = [req.file];
            // Import utility dynamically to avoid circular dep issues in some envs, or just import at top. 
            // Already imported at top? No, 'processUploadedImages' is in '../utils/fileUpload'.
            // AdminController didn't import it yet. I need to add import or dynamic import.
            // Dynamic is safer for this scoped change.
            const { processUploadedImages, UploadFolder } = await import('../utils/fileUpload');
            const processed = await processUploadedImages(files, UploadFolder.ADDONS);
            if (processed.length > 0) {
                addon.image = `/uploads${processed[0].original}`;
                addon.thumbnail = `/uploads${processed[0].thumbnail}`;
            }
        }

        await addon.save();
        res.json(addon);
    } catch (error) {
        console.error("Error updating addon:", error);
        res.status(500).json({ message: 'Error updating addon', error });
    }
};

// --- SUBSCRIPTIONS ---

export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, endDate, pausesRemaining } = req.body;

        const sub = await Subscription.findByPk(id);
        if (!sub) return res.status(404).json({ message: 'Subscription not found' });

        if (status) sub.status = status;
        if (endDate) sub.endDate = endDate;
        if (pausesRemaining !== undefined) sub.pausesRemaining = pausesRemaining;

        await sub.save();
        res.json({ message: 'Subscription updated', subscription: sub });
    } catch (error) {
        res.status(500).json({ message: 'Error updating subscription', error });
    }
};
// --- DELIVERY MANAGEMENT ---

export const getDeliveryPartners = async (req: Request, res: Response) => {
    try {
        const partners = await User.findAll({
            where: { role: 'delivery' },
            attributes: ['id', 'name', 'phone', 'email']
        });
        res.json(partners);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching delivery partners' });
    }
};

export const assignDelivery = async (req: Request, res: Response) => {
    try {
        const { subscriptionId, deliveryUserId } = req.body;

        // Check if a log already exists for today
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        let log = await DeliveryLog.findOne({
            where: {
                subscriptionId,
                deliveryTime: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        if (log) {
            // Update existing
            log.userId = deliveryUserId;
            log.status = 'ASSIGNED';
            await log.save();
        } else {
            // Create new assignment
            await DeliveryLog.create({
                subscriptionId,
                userId: deliveryUserId,
                status: 'ASSIGNED',
                deliveryTime: new Date() // Planned time (now)
            });
        }

        // Notify User
        const sub = await Subscription.findByPk(subscriptionId);
        if (sub) {
            await Notification.create({
                userId: sub.userId,
                title: 'Delivery Assigned! 🚚',
                message: 'Yo! Your fuel is on the move! Get ready to feast! 🚀',
                type: 'delivery'
            });
        }

        res.json({ message: 'Delivery assigned successfully' });
    } catch (error) {
        console.error("Assign error", error);
        res.status(500).json({ message: 'Error assigning delivery' });
    }
};

export const markReady = async (req: Request, res: Response) => {
    try {
        const { subscriptionId } = req.body;

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        let log = await DeliveryLog.findOne({
            where: {
                subscriptionId,
                deliveryTime: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        if (log) {
            log.status = 'READY';
            await log.save();
        } else {
            await DeliveryLog.create({
                subscriptionId,
                status: 'READY',
                deliveryTime: new Date()
            });
        }

        res.json({ message: 'Order marked as ready' });
    } catch (error) {
        console.error("Mark Ready error", error);
        res.status(500).json({ message: 'Error marking order as ready' });
    }
};
