import { Request, Response } from 'express';
import Plan from '../models/Plan';
import MenuItem from '../models/MenuItem';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- Image Upload Config ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({ storage: storage });

// --- Controllers ---

/**
 * Get full hierarchical menu (Plans -> MenuItems)
 */
export const getMenu = async (req: Request, res: Response) => {
    try {
        const plans = await Plan.findAll({
            include: [{ model: MenuItem, as: 'items' }]
        });
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch menu', error });
    }
};

/**
 * Update a Plan (Renaming)
 */
export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const plan = await Plan.findByPk(id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        if (name) plan.name = name;
        await plan.save();
        res.status(200).json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update plan', error });
    }
};

/**
 * Create a new Plan (Category)
 */
export const createPlan = async (req: Request, res: Response) => {
    try {
        const { name, slug } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Plan name is required' });
        }

        // Auto-generate slug from name if not provided
        const finalSlug = slug ? slug.toUpperCase() : name.toUpperCase().replace(/\s+/g, '_');

        const plan = await Plan.create({ name, slug: finalSlug });
        res.status(201).json(plan);
    } catch (error) {
        console.error('Create Plan Error:', error);
        res.status(500).json({ message: 'Failed to create plan', error });
    }
};

/**
 * Create a new Menu Item (Supports multiple images via `images` field)
 */
export const createMenuItem = async (req: Request, res: Response) => {
    try {
        const { planId, name, slug, description, proteinAmount, calories, price, color } = req.body;

        // Handle multiple file uploads
        let imageUrls: string[] = [];
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            imageUrls = files.map(file => `/uploads/${file.filename}`);
        }

        // For backward compatibility, also set first image as `image`
        const primaryImage = imageUrls.length > 0 ? imageUrls[0] : '';

        const menuItem = await MenuItem.create({
            planId,
            name,
            slug: slug.toUpperCase(),
            description,
            proteinAmount,
            calories,
            price,
            color,
            image: primaryImage,
            images: imageUrls
        });

        res.status(201).json(menuItem);
    } catch (error) {
        console.error("Create Item Error:", error);
        res.status(500).json({ message: 'Failed to create menu item', error });
    }
};

/**
 * Update a Menu Item (Supports multiple images via multipart form)
 */
export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await MenuItem.findByPk(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const { name, description, proteinAmount, calories, price, color } = req.body;

        // Update fields if provided
        if (name) item.name = name;
        if (description) item.description = description;
        if (proteinAmount) item.proteinAmount = proteinAmount;
        if (calories) item.calories = calories;
        if (price) item.price = price;
        if (color) item.color = color;

        // Handle multiple file uploads if provided
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            const imageUrls = files.map(file => `/uploads/${file.filename}`);
            item.images = imageUrls;
            item.image = imageUrls[0]; // Also update primary image for backward compatibility
        }

        await item.save();
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update item', error });
    }
};

/**
 * Delete a Menu Item
 */
export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await MenuItem.findByPk(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Optional: Delete image file if exists
        // const imagePath = path.join(__dirname, '../../', item.image);
        // if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        await item.destroy();
        res.status(200).json({ message: 'Item deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete item', error });
    }
};

/**
 * Delete a Plan
 */
export const deletePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const plan = await Plan.findByPk(id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Check if plan has associated items? 
        // If we want cascade delete, we can let DB handle or manually delete.
        // For simplicity, let's delete items first or rely on constraints.
        // Assuming we want to delete items too:
        await MenuItem.destroy({ where: { planId: id } });
        await plan.destroy();

        res.status(200).json({ message: 'Plan and its items deleted successfully' });
    } catch (error) {
        console.error("Delete Plan Error:", error);
        res.status(500).json({ message: 'Failed to delete plan', error });
    }
};
