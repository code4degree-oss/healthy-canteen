import { Request, Response } from 'express';
import Plan from '../models/Plan';
import MenuItem from '../models/MenuItem';
import AddOn from '../models/AddOn';
import {
    menuUpload,
    processUploadedImages,
    deleteFiles,
    UploadFolder
} from '../utils/fileUpload';

// Export the menu upload middleware
export const upload = menuUpload;

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
 * Get all AddOns (Public)
 */
export const getAddOns = async (req: Request, res: Response) => {
    try {
        const addons = await AddOn.findAll();
        res.status(200).json(addons);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch addons', error });
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
 * Images are automatically compressed and thumbnails are generated
 */
export const createMenuItem = async (req: Request, res: Response) => {
    try {
        const { planId, name, slug, description, proteinAmount, calories, price, color } = req.body;

        // Handle multiple file uploads with compression and thumbnail generation
        let imageUrls: string[] = [];
        let thumbnailPath = '';

        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            // Process images: compress and generate thumbnails
            const processedImages = await processUploadedImages(files, UploadFolder.MENU_ITEMS);
            imageUrls = processedImages.map(img => `/uploads${img.original}`);
            // Use the first image's thumbnail as the main thumbnail
            if (processedImages.length > 0) {
                thumbnailPath = `/uploads${processedImages[0].thumbnail}`;
            }
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
            thumbnail: thumbnailPath,
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
 * Images are automatically compressed and thumbnails are generated
 */
export const updateMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await MenuItem.findByPk(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const { name, description, proteinAmount, calories, price, color } = req.body;

        // Update fields if provided
        if (name !== undefined) item.name = name;
        if (description !== undefined) item.description = description;
        if (proteinAmount !== undefined) item.proteinAmount = proteinAmount;
        if (calories !== undefined) item.calories = calories;
        if (price !== undefined) item.price = price;
        if (color !== undefined) item.color = color;

        // Handle multiple file uploads if provided
        const files = req.files as Express.Multer.File[];
        if (files && files.length > 0) {
            // Delete old images first
            if (item.images && item.images.length > 0) {
                await deleteFiles(item.images);
            }

            // Process new images: compress and generate thumbnails
            const processedImages = await processUploadedImages(files, UploadFolder.MENU_ITEMS);
            const imageUrls = processedImages.map(img => `/uploads${img.original}`);
            item.images = imageUrls;
            item.image = imageUrls[0]; // Also update primary image for backward compatibility
            if (processedImages.length > 0) {
                item.thumbnail = `/uploads${processedImages[0].thumbnail}`;
            }
        }

        await item.save();
        res.status(200).json(item);
    } catch (error) {
        console.error("Update Item Error:", error);
        res.status(500).json({ message: 'Failed to update item', error });
    }
};

/**
 * Delete a Menu Item (Also cleans up associated image files)
 */
export const deleteMenuItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await MenuItem.findByPk(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Delete associated image files
        if (item.images && item.images.length > 0) {
            const deletedCount = await deleteFiles(item.images);
            console.log(`🗑️ Deleted ${deletedCount} image files for item ${item.name}`);
        }

        await item.destroy();
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error("Delete Item Error:", error);
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

/**
 * Reorder Menu Items (for drag-and-drop)
 * Expects an array of { id, sortOrder } in request body
 */
export const reorderMenuItems = async (req: Request, res: Response) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: 'Invalid items array' });
        }

        // Update sort order for each item
        for (const item of items) {
            await MenuItem.update(
                { sortOrder: item.sortOrder },
                { where: { id: item.id } }
            );
        }

        res.status(200).json({ message: 'Items reordered successfully' });
    } catch (error) {
        console.error("Reorder Items Error:", error);
        res.status(500).json({ message: 'Failed to reorder items', error });
    }
};
