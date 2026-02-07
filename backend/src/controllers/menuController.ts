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
 * Create a new Plan (Category)
 */
export const createPlan = async (req: Request, res: Response) => {
    try {
        const { name, slug } = req.body;
        const plan = await Plan.create({ name, slug: slug.toUpperCase() });
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create plan', error });
    }
};

/**
 * Create a new Menu Item
 */
export const createMenuItem = async (req: Request, res: Response) => {
    try {
        const { planId, name, slug, description, proteinAmount, calories, price, color } = req.body;

        let imageUrl = '';
        if (req.file) {
            // Store relative path or full URL depending on how you serve statics
            // Here assuming we'll serve /uploads folder statically
            imageUrl = `/uploads/${req.file.filename}`;
        }

        const menuItem = await MenuItem.create({
            planId,
            name,
            slug: slug.toUpperCase(),
            description,
            proteinAmount,
            calories,
            price, // Expecting base price
            color,
            image: imageUrl
        });

        res.status(201).json(menuItem);
    } catch (error) {
        console.error("Create Item Error:", error);
        res.status(500).json({ message: 'Failed to create menu item', error });
    }
};

/**
 * Update a Menu Item
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

        // Note: Image update logic omitted for brevity, can be added if needed

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
