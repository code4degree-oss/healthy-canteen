/**
 * Scheduled Jobs — Runs periodic checks for the application
 * Currently: sends email reminders for subscriptions paused 5+ days
 */
import { Op } from 'sequelize';
import Subscription from '../models/Subscription';
import User from '../models/User';
import { sendPauseReminder } from '../services/emailService';

/**
 * Check for subscriptions paused for 5+ days and send a reminder email.
 * Runs once daily. Only sends one reminder per pause (at the 5-day mark).
 */
const checkPausedSubscriptions = async () => {
    try {
        const now = new Date();
        // Find subscriptions paused exactly 5 days ago (within a 24h window to avoid re-sending)
        const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
        const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

        const pausedSubs = await Subscription.findAll({
            where: {
                status: 'PAUSED',
                lastPausedAt: {
                    [Op.between]: [sixDaysAgo, fiveDaysAgo]
                }
            }
        });

        if (pausedSubs.length === 0) return;

        console.log(`[Scheduler] Found ${pausedSubs.length} subscription(s) paused for ~5 days`);

        for (const sub of pausedSubs) {
            const user = await User.findByPk(sub.userId);
            if (user && user.email) {
                const pausedMs = now.getTime() - new Date(sub.lastPausedAt!).getTime();
                const pausedDays = Math.floor(pausedMs / (1000 * 60 * 60 * 24));

                sendPauseReminder(user.email, user.name || 'Customer', {
                    protein: sub.protein,
                    pausedSinceDays: pausedDays
                }).catch(err => console.error('[Scheduler] Pause reminder email failed:', err));

                console.log(`[Scheduler] Sent pause reminder to ${user.email} (${pausedDays} days paused)`);
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error checking paused subscriptions:', error);
    }
};

/**
 * Start all scheduled jobs
 */
export const startScheduledJobs = () => {
    console.log('[Scheduler] Starting scheduled jobs...');

    // Run pause check once on startup (delayed 30s to let server settle)
    setTimeout(checkPausedSubscriptions, 30000);

    // Then run every 24 hours
    setInterval(checkPausedSubscriptions, 24 * 60 * 60 * 1000);

    console.log('[Scheduler] Pause reminder check: runs every 24 hours');
};
