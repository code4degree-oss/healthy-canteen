import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
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

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        // 1. Active Users (Users with at least one ACTIVE subscription)
        const activeUsersCount = await User.count({
            distinct: true,
            include: [{
                model: Subscription,
                as: 'subscriptions',
                where: { status: 'ACTIVE' },
                required: true
            }]
        });

        // 2. Total Revenue (Sum of all orders)
        const totalRevenue = await Order.sum('totalPrice');

        // 3. Meals to Prep Today (Aggregate active subscriptions by protein & mealType)
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

        const activeSubsToday = await Subscription.findAll({
            where: {
                status: 'ACTIVE',
                startDate: { [Op.lte]: today },
                endDate: { [Op.gte]: today }
            },
            attributes: ['protein', 'mealsPerDay', 'mealTypes']
        });

        // Structure: { LUNCH: { CHICKEN: 5, PANEER: 3 }, DINNER: { CHICKEN: 4, PANEER: 2 } }
        const proteinCounts: Record<string, Record<string, number>> = {
            LUNCH: {},
            DINNER: {}
        };

        activeSubsToday.forEach(sub => {
            const protein = sub.protein?.toUpperCase() || 'UNKNOWN';
            // Ensure mealTypes is an array. Handle legacy data or defaults.
            let types: string[] = Array.isArray(sub.mealTypes) ? sub.mealTypes : ['LUNCH'];

            // Legacy fix for Today
            if (sub.mealsPerDay == 2 && types.length === 1 && types[0] === 'LUNCH') {
                types = ['LUNCH', 'DINNER'];
            }

            if (types.includes('LUNCH')) {
                proteinCounts.LUNCH[protein] = (proteinCounts.LUNCH[protein] || 0) + 1;
            }
            if (types.includes('DINNER')) {
                proteinCounts.DINNER[protein] = (proteinCounts.DINNER[protein] || 0) + 1;
            }
        });

        // --- NEW: Meals to Prep for Tomorrow ---
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const activeSubsTomorrow = await Subscription.findAll({
            where: {
                status: 'ACTIVE',
                startDate: { [Op.lte]: tomorrow },
                endDate: { [Op.gte]: tomorrow }
            },
            attributes: ['protein', 'mealsPerDay', 'mealTypes']
        });

        const tomorrowPrepCounts: Record<string, Record<string, number>> = {
            LUNCH: {},
            DINNER: {}
        };

        activeSubsTomorrow.forEach(sub => {
            const protein = sub.protein?.toUpperCase() || 'UNKNOWN';
            let types: string[] = Array.isArray(sub.mealTypes) ? sub.mealTypes : ['LUNCH'];

            // Legacy fix
            // console.log(`Sub ${sub.id}: mealsPerDay=${sub.mealsPerDay} (${typeof sub.mealsPerDay}), mealTypes=${JSON.stringify(sub.mealTypes)}`);
            const originalTypes = [...types];
            if (sub.mealsPerDay == 2 && types.length === 1 && types[0] === 'LUNCH') {
                types = ['LUNCH', 'DINNER'];
                // console.log(`-> Patched to LUNCH+DINNER`);
            }

            if (types.includes('LUNCH')) {
                tomorrowPrepCounts.LUNCH[protein] = (tomorrowPrepCounts.LUNCH[protein] || 0) + 1;
            }
            if (types.includes('DINNER')) {
                tomorrowPrepCounts.DINNER[protein] = (tomorrowPrepCounts.DINNER[protein] || 0) + 1;
            }
        });

        console.log('Protein Counts:', JSON.stringify(tomorrowPrepCounts, null, 2));

        // 4. Recent Orders
        const recentOrders = await Order.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['name'] }]
        });

        const recentOrdersFormatted = recentOrders.map(order => ({
            id: order.id,
            customerName: (order as any).user?.name || 'Unknown',
            date: new Date(order.createdAt).toLocaleDateString(),
            amount: order.totalPrice,
            description: `${order.days} Days`
        }));

        res.json({
            activeCount: activeUsersCount,
            totalRevenue: totalRevenue || 0,
            proteinCounts, // Now returns { LUNCH: {...}, DINNER: {...} }
            tomorrowPrepCounts,
            recentOrders: recentOrdersFormatted
        });
    } catch (error: any) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({
            message: 'Error fetching stats',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

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
            attributes: ['id', 'name', 'email', 'role', 'createdAt', 'phone', 'address'],
            include: [
                {
                    model: Order,
                    as: 'orders',
                    attributes: ['id', 'totalPrice', 'createdAt', 'days', 'mealsPerDay', 'notes']
                },
                {
                    model: Subscription,
                    as: 'subscriptions',
                    attributes: ['id', 'status', 'protein', 'mealsPerDay', 'daysRemaining', 'deliveryAddress', 'addons', 'startDate', 'endDate', 'mealTypes', 'createdAt'],
                    include: [
                        {
                            model: Order,
                            attributes: ['deliveryLat', 'deliveryLng']
                        },
                        {
                            model: DeliveryLog,
                            as: 'deliveryLogs',
                            attributes: ['id', 'status', 'deliveryTime', 'userId', 'mealType'],
                            include: [{ model: User, as: 'deliveryAgent', attributes: ['id', 'name'] }]
                        }
                    ]
                }
            ],
            limit,
            offset,
            distinct: true, // Ensure correct count with includes
            order: [['createdAt', 'DESC']]
        });

        const usersWithValidSubs = rows.map((user: any) => {
            const userJSON = user.toJSON();
            if (userJSON.subscriptions) {
                userJSON.subscriptions = userJSON.subscriptions.map((sub: any) => {
                    // Legacy fix: If mealsPerDay is 2 but mealTypes is default ['LUNCH'], upgrade to both
                    if (sub.mealsPerDay === 2 && Array.isArray(sub.mealTypes) && sub.mealTypes.length === 1 && sub.mealTypes[0] === 'LUNCH') {
                        sub.mealTypes = ['LUNCH', 'DINNER'];
                    }
                    return sub;
                });
            }
            return userJSON;
        });

        res.json({
            users: usersWithValidSubs,
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error: any) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            message: 'Error fetching users',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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
        const { name, slug, description, proteinAmount, calories, price, color } = req.body;
        let images: string[] = [];

        // 1. Handle existing images (passed as strings)
        if (req.body.existingImages) {
            const existing = Array.isArray(req.body.existingImages)
                ? req.body.existingImages
                : [req.body.existingImages];
            images = [...images, ...existing];
        }

        // 2. Handle new uploads
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const { processUploadedImages, UploadFolder } = await import('../utils/fileUpload');
            const processed = await processUploadedImages(req.files as Express.Multer.File[], UploadFolder.MENU_ITEMS);
            const newUrls = processed.map(p => `/uploads${p.original}`);
            images = [...images, ...newUrls];
        }

        const item = await MenuItem.create({
            name, slug, description,
            proteinAmount, calories, price, color,
            images,
            image: images.length > 0 ? images[0] : null // Set primary image
        });
        res.status(201).json(item);
    } catch (error) {
        console.error("Error adding menu item:", error);
        res.status(500).json({ message: 'Error adding menu item', error });
    }
};

export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, slug, description, proteinAmount, calories, price, color } = req.body;

        const item = await MenuItem.findByPk(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Update basic fields
        if (name !== undefined) item.name = name;
        if (slug !== undefined) item.slug = slug;
        if (description !== undefined) item.description = description;
        if (proteinAmount !== undefined) item.proteinAmount = proteinAmount;
        if (calories !== undefined) item.calories = calories;
        if (price !== undefined) item.price = price;
        if (color !== undefined) item.color = color;

        // Image Handling (Merge existing string URLs with new uploads)
        let finalImages: string[] = [];

        // 1. Strings (Existing URLs passed back from frontend)
        if (req.body.images) {
            // In multipart/form-data, logic can be tricky if sending array. 
            // Frontend typically sends 'images[]'.
            const imgs = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
            // Filter out any "undefined" or empty strings that might slip in
            finalImages = imgs.filter((i: string) => i && typeof i === 'string' && i.startsWith('/uploads'));
        }

        // 2. New Uploads
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const { processUploadedImages, UploadFolder } = await import('../utils/fileUpload');
            const processed = await processUploadedImages(req.files as Express.Multer.File[], UploadFolder.MENU_ITEMS);
            const newUrls = processed.map(p => `/uploads${p.original}`);
            finalImages = [...finalImages, ...newUrls];
        }

        // Only update images if we actually received something (to allow partial updates of other fields without wiping images)
        // BUT for an update form that sends the "current state" of images (including deletions), we WANT to overwrite.
        // We'll assume the frontend sends the *complete* list of images desired.
        // If req.body.images OR req.files is present, we update.
        if (req.body.images || (req.files && Array.isArray(req.files) && (req.files as any).length > 0)) {
            item.images = finalImages;
            // Update primary image (first one)
            item.image = finalImages.length > 0 ? finalImages[0] : '';
        }

        await item.save();
        res.json({ message: 'Menu item updated', item });
    } catch (error) {
        console.error("Error updating menu item:", error);
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

        // 1. Check if image URL is passed (selected from gallery)
        if (req.body.image && typeof req.body.image === 'string') {
            image = req.body.image;
            thumbnail = req.body.image; // Use same for thumbnail for now
        }

        // 2. Check for file upload (overrides string if present)
        if (req.file) {
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

        if (name !== undefined) addon.name = name;
        if (price !== undefined) addon.price = price;
        if (description !== undefined) addon.description = description;
        if (allowSubscription !== undefined) {
            addon.allowSubscription = allowSubscription === 'true' || allowSubscription === true;
        }

        // 1. Handle String URL
        if (req.body.image && typeof req.body.image === 'string') {
            addon.image = req.body.image;
            addon.thumbnail = req.body.image;
        }

        // 2. Handle File Upload
        if (req.file) {
            const files = [req.file];
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
        const { subscriptionId, deliveryUserId, mealType } = req.body;

        // Check if a log already exists for today
        const now = new Date();
        // Use UTC for consistent day tracking
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        let log = await DeliveryLog.findOne({
            where: {
                subscriptionId,
                mealType: mealType || 'LUNCH',
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
                deliveryTime: new Date(), // Planned time (now)
                mealType: mealType || 'LUNCH'
            });
        }

        // Notify User
        const sub = await Subscription.findByPk(subscriptionId);
        if (sub) {
            await Notification.create({
                userId: sub.userId,
                title: 'Delivery Assigned! 🚚',
                message: `Yo! Your ${mealType || 'LUNCH'} is on the move! Get ready to feast! 🚀`,
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
        const { subscriptionId, mealType } = req.body;

        const now = new Date();
        // Use UTC for consistent day tracking
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        let log = await DeliveryLog.findOne({
            where: {
                subscriptionId,
                mealType: mealType || 'LUNCH',
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
                deliveryTime: new Date(),
                mealType: mealType || 'LUNCH'
            });
        }

        res.json({ message: 'Order marked as ready' });
    } catch (error) {
        console.error("Mark Ready error", error);
        res.status(500).json({ message: 'Error marking order as ready' });
    }
};

// --- IMAGE MANAGEMENT ---

export const getImages = async (req: Request, res: Response) => {
    try {
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            return res.json([]);
        }

        // Use readdir with withFileTypes for faster scanning (avoids separate stat calls)
        const dirents = await fs.promises.readdir(uploadsDir, { withFileTypes: true });

        const images = dirents
            .filter(dirent => dirent.isFile() && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(dirent.name))
            .map(dirent => ({
                name: dirent.name,
                url: `/uploads/${dirent.name}`,
                // We skip size/date for speed unless absolutely necessary. 
                // If sorting by date is required, we'd need 'stat', but let's see if we can do without or use a faster method.
                // For now, let's just return names. If we REALLY need sort by date, we can use fs.stat but concurrently.
            }));

        // If we want to sort by date (newest first), we do need stats. 
        // Let's do it efficiently with Promise.all if standard readdir isn't enough.
        // Actually, for a gallery, sorting by date is usually important.

        const imagesWithDate = await Promise.all(
            images.map(async (img) => {
                const stats = await fs.promises.stat(path.join(uploadsDir, img.name));
                return { ...img, date: stats.mtime, size: stats.size };
            })
        );

        imagesWithDate.sort((a, b) => b.date.getTime() - a.date.getTime());

        res.json(imagesWithDate);
    } catch (error) {
        console.error("Error fetching images:", error);
        res.status(500).json({ message: 'Error fetching images', error });
    }
};

export const deleteImage = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        if (!filename) return res.status(400).json({ message: 'Filename required' });

        // Prevent directory traversal
        const safeFilename = path.basename(filename);
        const filepath = path.join(__dirname, '../../uploads', safeFilename);

        // 1. Delete from Disk
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        } else {
            console.warn(`File not found on disk: ${filepath}`);
        }

        const imagePath = `/uploads/${safeFilename}`;

        // 3. Cleanup MenuItems (Optimized)
        // Direct matches
        await MenuItem.update({ image: null }, { where: { image: imagePath } });
        // Assuming thumbnail is also a string path
        // await MenuItem.update({ thumbnail: null }, { where: { thumbnail: imagePath } }); 

        // JSON Array scan (Optimized using Postgres Operator if available, but for SQLite/Basic JSON, we need a better approach than fetching all)
        // Since we are using Sequelize with Postgres (per requirements), we can use the JSON operators.
        // However, if we want to be safe and generic without raw queries:
        // We can fetch ONLY items that contain the image in the array.

        // Postgres: 
        // WHERE "images" @> '["/uploads/filename.jpg"]'

        const itemsWithImage = await MenuItem.findAll({
            where: {
                images: {
                    [Op.contains]: [imagePath] // This is much faster than fetching ALL items
                }
            }
        });

        for (const item of itemsWithImage) {
            const newImages = item.images.filter((img: string) => img !== imagePath);
            await MenuItem.update({ images: newImages }, { where: { id: item.id } });
        }

        // 4. Cleanup AddOns
        await AddOn.update({ image: null }, { where: { image: imagePath } });
        await AddOn.update({ thumbnail: null }, { where: { thumbnail: imagePath } });

        res.json({ message: 'Image deleted and database references cleaned.' });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ message: 'Error deleting image', error });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, role } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) user.address = address;
        if (role !== undefined) user.role = role;

        await user.save();

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: 'Error updating user', error });
    }
};
export const getDeliveryHistory = async (req: Request, res: Response) => {
    try {
        const dateStr = req.query.date as string; // YYYY-MM-DD
        if (!dateStr) {
            return res.status(400).json({ message: 'Date is required (YYYY-MM-DD)' });
        }

        const startOfDay = new Date(dateStr);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(dateStr);
        endOfDay.setHours(23, 59, 59, 999);

        const logs = await DeliveryLog.findAll({
            where: {
                deliveryTime: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            },
            include: [
                {
                    model: User,
                    as: 'deliveryAgent',
                    attributes: ['id', 'name', 'phone']
                },
                {
                    model: Subscription,
                    include: [{ model: User, attributes: ['name', 'address', 'phone'] }]
                }
            ],
            order: [['deliveryTime', 'DESC']]
        });

        res.json(logs);
    } catch (error) {
        console.error("Error fetching delivery history:", error);
        res.status(500).json({ message: 'Error fetching delivery history' });
    }
};
