import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Subscription from '../models/Subscription';
import User from '../models/User';
import Order from '../models/Order';
import DeliveryLog from '../models/DeliveryLog';

export const getDeliveryQueue = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // Fetch logs assigned to this user for today
        const assignedLogs = await DeliveryLog.findAll({
            where: {
                userId: (req as any).user.id,
                deliveryTime: { [Op.between]: [startOfDay, endOfDay] },
                status: { [Op.notIn]: ['DELIVERED', 'NO_RECEIVE'] } // Show pending/assigned only
            },
            include: [
                {
                    model: Subscription,
                    include: [
                        { model: User, attributes: ['name', 'address', 'phone'] },
                        { model: Order, attributes: ['deliveryLat', 'deliveryLng'] }
                    ]
                }
            ]
        });

        const queue = assignedLogs.map(log => {
            const sub = (log as any).Subscription;
            if (!sub) return null;

            return {
                id: sub.id,
                customerName: sub.User.name,
                address: sub.deliveryAddress || sub.User.address || 'No Address',
                phone: sub.User.phone || 'N/A',
                type: sub.protein,
                meals: sub.mealsPerDay,
                timeSlot: '12:00 PM - 2:00 PM',
                status: log.status,
                lat: sub.Order?.deliveryLat,
                lng: sub.Order?.deliveryLng,
                logId: log.id
            };
        }).filter(Boolean);

        res.json(queue);
    } catch (error) {
        console.error("Delivery Queue Error:", error);
        res.status(500).json({ message: "Failed to fetch delivery queue" });
    }
};

export const confirmDelivery = async (req: Request, res: Response) => {
    try {
        const { subscriptionId, lat, lng } = req.body;
        const userId = (req as any).user.id;

        if (!subscriptionId) {
            return res.status(400).json({ message: 'Subscription ID is required' });
        }

        // Find existing log for today (created by markReady/assignDelivery)
        const today = new Date();
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
        const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

        let log = await DeliveryLog.findOne({
            where: {
                subscriptionId,
                deliveryTime: { [Op.between]: [startOfDay, endOfDay] }
            }
        });

        if (log) {
            // Update existing log to DELIVERED with location
            log.status = 'DELIVERED';
            log.latitude = lat;
            log.longitude = lng;
            log.userId = userId;
            log.deliveryTime = new Date(); // Update to actual delivery time
            await log.save();
        } else {
            // No existing log — create a new DELIVERED log
            await DeliveryLog.create({
                subscriptionId,
                userId,
                latitude: lat,
                longitude: lng,
                status: 'DELIVERED',
                deliveryTime: new Date()
            });
        }

        res.json({ message: 'Delivery confirmed successfully' });
    } catch (error) {
        console.error("Delivery Confirmation Error:", error);
        res.status(500).json({ message: "Failed to confirm delivery" });
    }
};

export const markNoReceive = async (req: Request, res: Response) => {
    try {
        const { subscriptionId } = req.body;
        const userId = (req as any).user.id;

        if (!subscriptionId) {
            return res.status(400).json({ message: 'Subscription ID is required' });
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        let log = await DeliveryLog.findOne({
            where: {
                subscriptionId,
                deliveryTime: { [Op.between]: [startOfDay, endOfDay] }
            }
        });

        if (log) {
            log.status = 'NO_RECEIVE';
            log.userId = userId;
            log.deliveryTime = new Date();
            await log.save();
        } else {
            await DeliveryLog.create({
                subscriptionId,
                userId,
                status: 'NO_RECEIVE',
                deliveryTime: new Date()
            });
        }

        res.json({ message: 'Marked as no one to receive' });
    } catch (error) {
        console.error("Mark No Receive Error:", error);
        res.status(500).json({ message: "Failed to update delivery status" });
    }
};

export const getDeliveryHistory = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const dateStr = req.query.date as string; // YYYY-MM-DD

        let startOfDay: Date, endOfDay: Date;
        if (dateStr) {
            const d = new Date(dateStr);
            startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
            endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        } else {
            const now = new Date();
            startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }

        const logs = await DeliveryLog.findAll({
            where: {
                userId,
                deliveryTime: { [Op.between]: [startOfDay, endOfDay] },
                status: { [Op.in]: ['DELIVERED', 'NO_RECEIVE'] }
            },
            include: [
                {
                    model: Subscription,
                    include: [
                        { model: User, attributes: ['name', 'address', 'phone'] },
                        { model: Order, attributes: ['deliveryLat', 'deliveryLng'] }
                    ]
                }
            ],
            order: [['deliveryTime', 'DESC']]
        });

        const history = logs.map(log => {
            const sub = (log as any).Subscription;
            return {
                id: log.id,
                subscriptionId: sub?.id,
                customerName: sub?.User?.name || 'Unknown',
                address: sub?.deliveryAddress || sub?.User?.address || 'No Address',
                type: sub?.protein || 'Unknown',
                status: log.status,
                deliveryTime: log.deliveryTime,
                latitude: log.latitude,
                longitude: log.longitude
            };
        });

        res.json(history);
    } catch (error) {
        console.error("Delivery History Error:", error);
        res.status(500).json({ message: "Failed to fetch delivery history" });
    }
};
