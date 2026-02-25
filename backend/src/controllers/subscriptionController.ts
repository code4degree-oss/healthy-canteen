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

            // 4PM IST CUTOFF — Hold requests must be submitted before 4:00 PM IST
            const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const currentHour = nowIST.getHours();
            if (currentHour >= 16) { // 16:00 = 4 PM
                await t.rollback();
                return res.status(400).json({
                    message: 'Pause requests must be submitted before 4:00 PM IST. Please try again tomorrow before 4 PM.'
                });
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

        const subscription = await Subscription.findOne({
            where: { id: subscriptionId, userId },
            transaction: t
        });

        if (!subscription) {
            await t.rollback();
            return res.status(404).json({ message: 'Subscription not found' });
        }

        if (subscription.status === 'CANCELLED' || subscription.status === 'EXPIRED') {
            await t.rollback();
            return res.status(400).json({ message: 'Subscription is already cancelled or expired.' });
        }

        // Cancellation Rule: Allowed only within the first 3 days of service
        const startDate = new Date(subscription.startDate);
        const now = new Date();
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

        if (daysSinceStart > 3) {
            await t.rollback();
            return res.status(400).json({
                message: 'Cancellation is only allowed within the first 3 days of service. Your plan started more than 3 days ago.'
            });
        }

        // Fetch the linked order to get totalPrice
        const order = await (await import('../models/Order')).default.findByPk(subscription.orderId, { transaction: t });
        const totalPaid = order ? order.totalPrice : 0;

        // Calculate the total plan days from subscription
        const endDate = new Date(subscription.endDate);
        const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));

        // Days consumed = totalDays - daysRemaining
        const daysConsumed = totalDays - subscription.daysRemaining;
        const perDayRate = totalPaid / totalDays;
        const consumedAmount = Math.round(perDayRate * daysConsumed);
        const grossRefund = totalPaid - consumedAmount;
        const adminFee = Math.round(grossRefund * 0.10); // 10% admin + processing fee
        const netRefund = grossRefund - adminFee;

        const refundBreakdown = {
            totalPaid,
            totalDays,
            daysConsumed,
            daysRemaining: subscription.daysRemaining,
            perDayRate: Math.round(perDayRate),
            consumedAmount,
            grossRefund,
            adminFeePercent: 10,
            adminFee,
            netRefund: Math.max(0, netRefund),
            note: 'Refund will be initiated within 24-48 hours.'
        };

        // Mark as CANCELLED with refund info
        subscription.status = 'CANCELLED';
        subscription.cancellationReason = reason || 'No reason provided';
        subscription.refundAmount = Math.max(0, netRefund);
        subscription.refundBreakdown = refundBreakdown;

        await subscription.save({ transaction: t });
        await t.commit();

        // Send cancellation email with refund breakdown (fire-and-forget)
        const cancelUser = await User.findByPk(userId);
        if (cancelUser && cancelUser.email) {
            sendSubscriptionCancelled(cancelUser.email, cancelUser.name || 'Customer', {
                protein: subscription.protein,
                reason: subscription.cancellationReason || 'No reason provided',
                refundBreakdown
            }).catch(err => console.error('[Email] Cancel email failed:', err));
        }

        res.status(200).json({
            message: 'Subscription cancelled successfully. Refund will be initiated within 24-48 hours.',
            subscription,
            refundBreakdown
        });
    } catch (error) {
        await t.rollback();
        console.error("Cancel Error:", error);
        res.status(500).json({ message: 'Failed to cancel subscription', error });
    }
};
