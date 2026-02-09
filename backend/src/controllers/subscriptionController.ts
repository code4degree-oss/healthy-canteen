import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import SubscriptionPause from '../models/SubscriptionPause';
import { Op } from 'sequelize';
import sequelize from '../config/database';

/**
 * Pause Subscription
 * Rules:
 * - Notice: 4 PM previous day
 * - Duration: 1-6 days
 * - Limit: 6 pauses per 24-day cycle
 */
export const pauseSubscription = async (req: Request, res: Response) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        const userId = (req as any).user.id;
        const { subscriptionId, startDate, days } = req.body;

        if (!subscriptionId || !startDate || !days) {
            await t.rollback();
            return res.status(400).json({ message: 'Missing required fields: subscriptionId, startDate, days' });
        }

        const subscription = await Subscription.findOne({ where: { id: subscriptionId, userId }, transaction: t });

        if (!subscription) {
            await t.rollback();
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription.status !== 'ACTIVE') {
            await t.rollback();
            return res.status(400).json({ message: 'Subscription is not active and cannot be paused.' });
        }

        // --- VALIDATION RULES ---

        // 1. Duration Check (1-6 days)
        if (days < 1 || days > 6) {
            await t.rollback();
            return res.status(400).json({ message: 'Pause duration must be between 1 and 6 days.' });
        }

        // 2. Pause Limit Check
        if (subscription.pausesRemaining <= 0) {
            await t.rollback();
            return res.status(400).json({ message: 'Maximum pause limit reached for this subscription cycle.' });
        }

        // 3. Notice Period Check (4 PM previous day)
        // Parse startDate correctly (it might be YYYY-MM-DD string)
        const pauseStart = new Date(startDate);
        // We set the time to 00:00:00 to represent the start of that day
        pauseStart.setHours(0, 0, 0, 0);

        const now = new Date();

        // Cutoff is 4 PM the day before
        const cutoffTime = new Date(pauseStart);
        cutoffTime.setDate(cutoffTime.getDate() - 1); // Previous day
        cutoffTime.setHours(16, 0, 0, 0); // 4:00 PM

        if (now > cutoffTime) {
            await t.rollback();
            return res.status(400).json({ message: 'Pause requests must be submitted by 4:00 PM the day prior.' });
        }

        // --- APPLY PAUSE ---

        // Calculate new end date for the pause period
        const pauseEnd = new Date(pauseStart);
        pauseEnd.setDate(pauseEnd.getDate() + (days - 1)); // inclusive

        // Create Pause Record
        await SubscriptionPause.create({
            subscriptionId: subscription.id,
            startDate: pauseStart,
            endDate: pauseEnd
        }, { transaction: t });

        // Update Subscription End Date (extend by full duration)
        const currentEndDate = new Date(subscription.endDate);
        const newEndDate = new Date(currentEndDate);
        newEndDate.setDate(newEndDate.getDate() + days);

        // Update subscription fields
        subscription.endDate = newEndDate;
        subscription.pausesRemaining -= 1;

        await subscription.save({ transaction: t });

        await t.commit(); // Commit transaction

        res.status(200).json({
            message: `Subscription paused for ${days} days. New end date: ${newEndDate.toISOString().split('T')[0]}`,
            subscription
        });

    } catch (error) {
        await t.rollback();
        console.error("Pause Subscription Error:", error);
        res.status(500).json({ message: 'Failed to pause subscription', error });
    }
};

export const cancelSubscription = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const userId = (req as any).user.id;
        const { subscriptionId } = req.body;

        const subscription = await Subscription.findOne({ where: { id: subscriptionId, userId }, transaction: t });

        if (!subscription) {
            await t.rollback();
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Cancellation Policy: First 3 days allow with refund
        const startDate = new Date(subscription.startDate);
        const now = new Date();

        // Calculate days since start
        const timeDiff = now.getTime() - startDate.getTime();
        const daysSinceStart = timeDiff / (1000 * 3600 * 24);

        if (daysSinceStart > 3) {
            await t.rollback();
            return res.status(400).json({ message: 'Cancellation only allowed within the first 3 days of service. Please contact support.' });
        }

        // Mark as CANCELLED
        subscription.status = 'CANCELLED';
        await subscription.save({ transaction: t });

        await t.commit();
        res.status(200).json({ message: 'Subscription cancelled successfully. Refund (minus 10% fee) will be processed.' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Failed to cancel subscription', error });
    }
};
