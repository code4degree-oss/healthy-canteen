import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import User from '../models/User';

export const getDeliveryQueue = async (req: Request, res: Response) => {
    try {
        // Fetch all active subscriptions with User details
        const activeSubs = await Subscription.findAll({
            where: { status: 'ACTIVE' },
            include: [{
                model: User,
                attributes: ['name', 'address', 'phone', 'email']
            }]
        });

        const queue = activeSubs.map(sub => ({
            id: sub.id,
            customerName: (sub as any).User.name,
            address: (sub as any).User.address || 'No Address Provided', // Fallback
            phone: (sub as any).User.phone || 'N/A',
            type: sub.protein, // CHICKEN/PANEER
            meals: sub.mealsPerDay,
            timeSlot: '12:00 PM - 2:00 PM', // Hardcoded for now, or could be in Order
            status: 'PENDING' // Delivery status (local state)
        }));

        res.json(queue);
    } catch (error) {
        console.error("Delivery Queue Error:", error);
        res.status(500).json({ message: "Failed to fetch delivery queue" });
    }
};
