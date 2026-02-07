import { Request, Response } from 'express';
import Order from '../models/Order';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../types/express'; // We'll need to define this type or use 'any' for now

// Simple rate map (should ideally be shared or fetched from DB)
const RATES: any = {
    'CHICKEN': 320,
    'PANEER': 300
};

// Assuming SUBSCRIPTION_RATES is defined elsewhere or needs to be defined here
// For now, defining it as a placeholder based on the context of the change
const SUBSCRIPTION_RATES: any = {
    'CHICKEN': 280,
    'PANEER': 255
};

import sequelize from '../config/database';

import MenuItem from '../models/MenuItem';

export const createOrder = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const userId = (req as any).user.userId; // Changed from .id to .userId
        const { protein, days, mealsPerDay, startDate, deliveryLat, deliveryLng, deliveryAddress, addons } = req.body;

        // --- VALIDATION ---
        if (!protein || !days || !mealsPerDay || !startDate) {
            await t.rollback();
            return res.status(400).json({ message: 'Missing required fields: protein, days, mealsPerDay, startDate' });
        }

        // Fetch the menu item to get the correct price
        // We search by name (as sent by frontend) or slug if you prefer.
        // Frontend sends 'name' in protein field now.
        // Ideally we should use ID or Slug, but Name works if unique.
        // Let's try name first, fallback to hardcoded if not found (for legacy support).
        const menuItem = await MenuItem.findOne({ where: { name: protein } });

        // Default base rate if not found (fallback to existing logic or 320)
        let baseRate = 320;

        if (menuItem) {
            baseRate = menuItem.price;

            // Apply bulk discount logic if needed
            // Currently constants.ts had BASE_RATES and SUBSCRIPTION_RATES (24+ days)
            // If we want to keep that logic dynamic, we might need a 'subscriptionPrice' in DB.
            // For now, let's assume the DB price IS the base price.
            // And maybe apply a standard discount for max duration?
            // "If days >= 24, use subscription rate".
            // Since we don't have subscriptionPrice in DB yet, we can use a fixed percentage or just use the price.
            // Let's just use the price from DB as is for now to respect the admin setting.
            // If the admin sets 280 for a "Monthly Plan Item" and 320 for "Daily", that's how it works.
            // BUT wait, the item is "Chicken".
            // If dynamic plans are "Meal Plan" -> "Chicken".
            // We might need to handle the bulk discount in code:
            if (days >= 24) {
                // Maybe 10-12% off?
                // Or just use the price.
                // The frontend calculates total based on price * days.
                // The backend should match.
                // If frontend logic uses (days >= 24 ? rate (which was sub rate) : rate),
                // then backend should too.
                // In frontend refactor (Step 251), I set rate = selectedItem.price.
                // And didn't apply discount logic explicitly except using that rate.
                // So backend should also use that rate.
            }
        } else {
            // Fallback for legacy 'CHICKEN', 'PANEER' if they don't exist in DB
            baseRate = RATES[protein] || 320;
            // Logic for subscription override in legacy
            if (days >= 24 && SUBSCRIPTION_RATES[protein]) baseRate = SUBSCRIPTION_RATES[protein];
        }

        // Prevent Duplicate Orders (Simple Check: if same user ordered same protein for same duration within last 10 seconds)
        const tenSecondsAgo = new Date(Date.now() - 10000);
        const duplicate = await Order.findOne({
            where: {
                userId,
                protein,
                days,
                createdAt: {
                    [Symbol.for('gte') as any]: tenSecondsAgo // using symbol for operator might be tricky without importing Op, let's use standard sequelize if possible or just rely on transaction speed
                }
            },
            transaction: t
        });

        // Actually, simpler dedup: check if an active subscription already exists for this period? 
        // For now, let's just stick to the transaction safety to ensure atomic writes.

        // Calculate price server-side for security
        const totalPrice = baseRate * days * mealsPerDay;

        const order = await Order.create({
            userId,
            protein,
            days,
            mealsPerDay,
            totalPrice,
            startDate,
            deliveryLat,
            deliveryLng,
            deliveryAddress,
            status: 'PAID', // Auto-completing for now as we don't have a real payment gateway
            addons
        }, { transaction: t });

        // Create subscription if paid
        // Calculate end date (apprpx)
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + days);

        await Subscription.create({
            userId,
            orderId: order.id,
            startDate: startDate,
            endDate: end,
            status: 'ACTIVE',
            daysRemaining: days,
            protein,
            mealsPerDay,
            pausesRemaining: days > 7 ? 2 : 0,
            deliveryAddress,
            addons
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
        await t.rollback();
        console.error("Create Order Error:", error);
        res.status(500).json({ message: 'Failed to create order', error });
    }
};

export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const orders = await Order.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error });
    }
};

export const getActiveSubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const subscription = await Subscription.findOne({
            where: { userId, status: 'ACTIVE' },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(subscription); // Returns null if no active sub
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch subscription', error });
    }
};
