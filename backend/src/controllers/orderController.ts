import { Request, Response } from 'express';
import Order from '../models/Order';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../types/express'; // We'll need to define this type or use 'any' for now

// Simple rate map (should ideally be shared or fetched from DB)
const RATES: any = {
    'CHICKEN': 320,
    'PANEER': 300
};

export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id; // From auth middleware
        const { protein, days, mealsPerDay, startDate } = req.body;

        // Calculate price server-side for security
        const baseRate = RATES[protein] || 320;
        let totalPrice = baseRate * days * mealsPerDay;

        // Apply bulk discount (simplified logic from frontend)
        if (days >= 24) {
            const discountRate = protein === 'CHICKEN' ? 280 : 255;
            totalPrice = discountRate * days * mealsPerDay;
        }

        const order = await Order.create({
            userId,
            protein,
            days,
            mealsPerDay,
            totalPrice,
            startDate,
            status: 'PAID' // Auto-completing for now as we don't have a real payment gateway
        });

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
            mealsPerDay
        });

        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
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
