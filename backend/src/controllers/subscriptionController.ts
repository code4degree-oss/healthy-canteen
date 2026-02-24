import { Request, Response } from 'express';
import Subscription from '../models/Subscription';
import SubscriptionPause from '../models/SubscriptionPause';
import User from '../models/User';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { sendSubscriptionPaused, sendSubscriptionResumed, sendSubscriptionCancelled } from '../services/emailService';

/**
 * Toggle Pause Subscription
 * - If ACTIVE -> PAUSED (set lastPausedAt)
 * - If PAUSED -> ACTIVE (calculate drift, shift endDate)
 */
export const pauseSubscription = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const userId = (req as any).user.id;
        const { subscriptionId } = req.body;

        const subscription = await Subscription.findOne({ where: { id: subscriptionId, userId }, transaction: t });

        if (!subscription) {
            await t.rollback();
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription.status === 'ACTIVE') {
            // Check pauses remaining
            if (subscription.pausesRemaining <= 0) {
                await t.rollback();
                return res.status(400).json({ message: 'No pauses remaining for this subscription.' });
            }

            // PAUSE ACTION
            subscription.status = 'PAUSED';
            subscription.lastPausedAt = new Date();
            subscription.pausesRemaining -= 1;

            await subscription.save({ transaction: t });
            await t.commit();

            // Send pause email (fire-and-forget)
            const pauseUser = await User.findByPk(userId);
            if (pauseUser && pauseUser.email) {
                sendSubscriptionPaused(pauseUser.email, pauseUser.name || 'Customer', {
                    protein: subscription.protein,
                    pausesRemaining: subscription.pausesRemaining
                }).catch(err => console.error('[Email] Pause email failed:', err));
            }

            return res.status(200).json({ message: 'Subscription paused.', subscription });

        } else if (subscription.status === 'PAUSED') {
            // RESUME ACTION
            const now = new Date();
            const lastPausedAt = subscription.lastPausedAt ? new Date(subscription.lastPausedAt) : now;

            // Calculate drift in ms
            const driftMs = now.getTime() - lastPausedAt.getTime();
            const driftDays = Math.ceil(driftMs / (1000 * 60 * 60 * 24));

            // Shift End Date
            const currentEndDate = new Date(subscription.endDate);
            const newEndDate = new Date(currentEndDate);
            newEndDate.setDate(newEndDate.getDate() + driftDays);

            subscription.status = 'ACTIVE';
            subscription.endDate = newEndDate;
            subscription.lastPausedAt = null; // Reset

            await subscription.save({ transaction: t });

            // Also log the pause period for records if needed
            await SubscriptionPause.create({
                subscriptionId: subscription.id,
                startDate: lastPausedAt,
                endDate: now
            }, { transaction: t });

            await t.commit();

            // Send resume email (fire-and-forget)
            const resumeUser = await User.findByPk(userId);
            if (resumeUser && resumeUser.email) {
                sendSubscriptionResumed(resumeUser.email, resumeUser.name || 'Customer', {
                    protein: subscription.protein,
                    driftDays,
                    newEndDate
                }).catch(err => console.error('[Email] Resume email failed:', err));
            }

            return res.status(200).json({ message: `Subscription resumed. Extended by ${driftDays} days.`, subscription });
        } else {
            await t.rollback();
            return res.status(400).json({ message: 'Subscription cannot be toggled (must be ACTIVE or PAUSED).' });
        }

    } catch (error) {
        await t.rollback();
        console.error("Pause Toggle Error:", error);
        res.status(500).json({ message: 'Failed to toggle subscription status', error });
    }
};

export const cancelSubscription = async (req: Request, res: Response) => {
    const t = await sequelize.transaction();
    try {
        const userId = (req as any).user.id;
        const { subscriptionId, reason } = req.body;

        const subscription = await Subscription.findOne({ where: { id: subscriptionId, userId }, transaction: t });

        if (!subscription) {
            await t.rollback();
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Calculate Total Duration
        const startDate = new Date(subscription.startDate);
        const endDate = new Date(subscription.endDate);
        const totalDurationMs = endDate.getTime() - startDate.getTime();
        const totalDurationDays = Math.ceil(totalDurationMs / (1000 * 3600 * 24));

        // Cancellation Rule: Allowed if Total Plan > 6 Days
        if (totalDurationDays <= 6) {
            await t.rollback();
            return res.status(400).json({ message: 'Cancellation is only available for plans longer than 6 days.' });
        }

        // Mark as CANCELLED
        subscription.status = 'CANCELLED';
        subscription.cancellationReason = reason || 'No reason provided';

        await subscription.save({ transaction: t });

        await t.commit();

        // Send cancellation email (fire-and-forget)
        const cancelUser = await User.findByPk(userId);
        if (cancelUser && cancelUser.email) {
            sendSubscriptionCancelled(cancelUser.email, cancelUser.name || 'Customer', {
                protein: subscription.protein,
                reason: subscription.cancellationReason || 'No reason provided'
            }).catch(err => console.error('[Email] Cancel email failed:', err));
        }

        res.status(200).json({ message: 'Subscription cancelled successfully.', subscription });
    } catch (error) {
        await t.rollback();
        console.error("Cancel Error:", error);
        res.status(500).json({ message: 'Failed to cancel subscription', error });
    }
};
