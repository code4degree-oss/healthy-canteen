import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Order from '../models/Order';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../types/express'; // We'll need to define this type or use 'any' for now
import Settings from '../models/Settings';
import { getDistanceKm } from '../utils/haversine';

// Simple rate map (should ideally be shared or fetched from DB)
// Rates are now fully dynamic from Database
// const RATES... removed
// const SUBSCRIPTION_RATES... removed

import sequelize from '../config/database';

import MenuItem from '../models/MenuItem';

export const createOrder = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const userId = (req as any).user.id; // JWT stores 'id' not 'userId'
        const { protein, days, mealsPerDay, startDate, deliveryLat, deliveryLng, deliveryAddress, addons, notes } = req.body;

        // --- VALIDATION ---
        if (!protein || !days || !mealsPerDay || !startDate) {
            await t.rollback();
            return res.status(400).json({ message: 'Missing required fields: protein, days, mealsPerDay, startDate' });
        }

        // --- SERVICE AREA CHECK ---
        if (deliveryLat && deliveryLng) {
            // Optimization: Fetch all settings in one query
            const allSettings = await Settings.findAll({
                where: {
                    key: { [Op.in]: ['outletLat', 'outletLng', 'serviceRadiusKm'] }
                }
            });

            const settingsMap = allSettings.reduce((acc: any, s: any) => {
                acc[s.key] = s.value;
                return acc;
            }, {});

            const outletLat = parseFloat(settingsMap['outletLat'] || '18.654949627383616');
            const outletLng = parseFloat(settingsMap['outletLng'] || '73.84475261136429');
            const maxRadius = parseFloat(settingsMap['serviceRadiusKm'] || '5');

            const distance = getDistanceKm(outletLat, outletLng, deliveryLat, deliveryLng);
            if (distance > maxRadius) {
                await t.rollback();
                return res.status(400).json({
                    message: `Sorry! We don't deliver to your area yet. You are ${distance.toFixed(1)}km away, but we only deliver within ${maxRadius}km.`,
                    distance: parseFloat(distance.toFixed(1)),
                    maxRadius
                });
            }
        }

        // Fetch the menu item to get the correct price
        // We search by name (as sent by frontend) or slug if you prefer.
        // Frontend sends 'name' in protein field now.
        const menuItem = await MenuItem.findOne({ where: { name: protein } });

        // Default base rate if not found 
        let baseRate = 0;

        if (menuItem) {
            baseRate = menuItem.price;
        } else {
            // If item not found, this is a critical error as we don't have hardcoded fallbacks anymore
            await t.rollback();
            return res.status(400).json({ message: `Menu item '${protein}' not found or price not set.` });
        }

        // Prevent Duplicate Orders (Simple Check: if same user ordered same protein for same duration within last 10 seconds)
        const tenSecondsAgo = new Date(Date.now() - 10000);
        const duplicate = await Order.findOne({
            where: {
                userId,
                protein,
                days,
                createdAt: {
                    [Op.gte]: tenSecondsAgo
                }
            },
            transaction: t
        });

        // Prevent duplicate submission
        if (duplicate) {
            await t.rollback();
            return res.status(409).json({ message: 'Duplicate order detected. Please wait before resubmitting.' });
        }

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
            addons,
            notes
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
        const subscriptions = await Subscription.findAll({
            where: { userId, status: 'ACTIVE' },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(subscriptions); // Returns array
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch subscriptions', error });
    }
};
