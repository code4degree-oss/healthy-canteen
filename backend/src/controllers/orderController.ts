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
import Notification from '../models/Notification';
import User from '../models/User';

export const createOrder = async (req: Request, res: Response) => {
    // --- Helper Functions ---
    const getMealDiscountPercentage = (d: number) => {
        if (d <= 6) return 0;
        if (d <= 12) return 0.03;
        if (d <= 18) return 0.05;
        return 0.07;
    };

    const getKefirDiscountPercentage = (d: number) => {
        if (d <= 6) return 0;
        if (d <= 12) return 0.10;
        if (d <= 18) return 0.20;
        return 0.275;
    };

    const t = await sequelize.transaction();
    try {
        const userId = (req as any).user.id; // JWT stores 'id' not 'userId'
        const { protein, days, mealsPerDay, startDate, deliveryLat, deliveryLng, deliveryAddress, addons, notes, mealTypes } = req.body;

        // --- VALIDATION ---
        if (!protein || !days || !mealsPerDay || !startDate) {
            await t.rollback();
            return res.status(400).json({ message: 'Missing required fields: protein, days, mealsPerDay, startDate' });
        }

        // Validate mealTypes if provided, else default based on mealsPerDay
        let finalMealTypes = mealTypes;
        if (!finalMealTypes || !Array.isArray(finalMealTypes) || finalMealTypes.length === 0) {
            // Fallback logic
            finalMealTypes = mealsPerDay === 2 ? ['LUNCH', 'DINNER'] : ['LUNCH'];
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
        // Use finalMealTypes length instead of just mealsPerDay to be safe
        const calculatedMealsPerDay = finalMealTypes.length;

        // Base Price with Discount
        const rawBasePrice = baseRate * days * calculatedMealsPerDay;
        const discount = getMealDiscountPercentage(days);
        const discountedBasePrice = Math.round(rawBasePrice * (1 - discount));

        let addOnTotal = 0;
        // Verify Addons Price if possible, or trust frontend but apply Kefir logic?
        // Ideally we should fetch Addon prices. But `addons` in body is just definitions/selections.
        // We need to iterate addons and calculate total.
        // Current implementation seems to rely on frontend for total?
        // Wait, existing code: `const totalPrice = baseRate * days * calculatedMealsPerDay;`
        // It completely IGNORED addons in the total price calculation! That seems like a bug in existing code or simplistic implementation.
        // Reading `orderController.ts` again...
        // It creates order with `totalPrice`.
        // It does NOT add addon prices to `totalPrice`.
        // The user request is about pricing logic. I should fix this to include addons if I can, OR just update the base part as requested.
        // Given the requirement is specific about "pricing logic", I should probably respect the existing pattern but I can't leave it broken if it was broken.
        // However, looking at the previous code, it seems the order total was ONLY the meal plan?
        // Let's look at frontend: `grandTotal = basePlanTotal + addonTotal + deliveryFee`.
        // The backend `createOrder` receives `totalPrice`? No, it calculates it!
        // See line 105: `const totalPrice = baseRate * days * calculatedMealsPerDay;`
        // It ignores Addons!
        // I should fix this to include addons.

        // Need to loop through provided addons to calculate price
        if (addons && typeof addons === 'object') {
            for (const [addonId, selection] of Object.entries(addons)) {
                const sel = selection as any;
                if (sel.quantity > 0) {
                    const addonDef = await import('../models/AddOn').then(m => m.default.findByPk(addonId));
                    if (addonDef) {
                        let price = addonDef.price;
                        if (addonDef.name.toLowerCase().includes('kefir')) {
                            price = Math.round(price * (1 - getKefirDiscountPercentage(days)));
                        }

                        if (sel.frequency === 'daily') {
                            addOnTotal += price * sel.quantity * days;
                        } else {
                            addOnTotal += price * sel.quantity;
                        }
                    }
                }
            }
        }

        const deliveryFee = days <= 5 ? 50 * days : 300;
        const totalPrice = discountedBasePrice + addOnTotal + deliveryFee;

        const order = await Order.create({
            userId,
            protein,
            days,
            mealsPerDay: calculatedMealsPerDay,
            totalPrice,
            startDate,
            deliveryLat,
            deliveryLng,
            deliveryAddress,
            status: 'PAID', // Auto-completing for now as we don't have a real payment gateway
            addons,
            notes,
            mealTypes: finalMealTypes
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
            mealsPerDay: calculatedMealsPerDay,
            pausesRemaining: days > 7 ? 2 : 0,
            deliveryAddress,
            addons,
            mealTypes: finalMealTypes
        }, { transaction: t });

        // Create Notification for Admins
        const admins = await User.findAll({ where: { role: 'admin' } });
        const customer = await User.findByPk(userId);
        const customerName = customer ? customer.name : 'Unknown';

        const notificationPromises = admins.map(admin => {
            return Notification.create({
                userId: admin.id,
                title: 'New Order! 🥗',
                message: `New Order: ${order.protein} (${finalMealTypes.join(' & ')}) for ${order.days} ${order.days === 1 ? 'Day' : 'Days'}. Customer: ${customerName}.`,
                type: 'info'
            });
        });
        await Promise.all(notificationPromises);

        await t.commit(); // Commit transaction only after everything succeeds

        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error: any) {
        await t.rollback();
        console.error("Order creation error:", error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
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
        const DeliveryLog = await import('../models/DeliveryLog').then(m => m.default);
        const User = await import('../models/User').then(m => m.default); // Ensure User is available

        const subscriptions = await Subscription.findAll({
            where: { userId, status: { [Op.in]: ['ACTIVE', 'PAUSED'] } }, // Fetch PAUSED too as per recent changes
            include: [
                {
                    model: DeliveryLog,
                    as: 'deliveryLogs',
                    required: false,
                    include: [
                        {
                            model: User,
                            as: 'deliveryAgent',
                            attributes: ['name', 'phone'], // Fetch rider details
                            required: false
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(subscriptions); // Returns array
    } catch (error: any) {
        console.error("Error fetching active subscription:", error);
        res.status(500).json({ message: 'Failed to fetch subscriptions', error: error.message });
    }
};
