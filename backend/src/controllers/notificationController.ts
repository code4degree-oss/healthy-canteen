import { Request, Response } from 'express';
import { Sequelize } from 'sequelize'; // Helper
import Notification from '../models/Notification';
import User from '../models/User';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const notifications = await Notification.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        const notification = await Notification.findOne({ where: { id, userId } });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update notification', error });
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { id } = req.params;

        const notification = await Notification.findOne({ where: { id, userId } });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await notification.destroy();
        res.status(200).json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete notification', error });
    }
};

export const broadcastNotification = async (req: Request, res: Response) => {
    try {
        const { title, message, type } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }

        // Get all users
        const users = await User.findAll({ attributes: ['id'] });

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        // Create notifications for all users
        const notifications = users.map(user => ({
            userId: user.id,
            title,
            message,
            type: type || 'info',
            isRead: false
        }));

        await Notification.bulkCreate(notifications);

        res.status(201).json({ message: `Broadcast sent to ${users.length} users` });
    } catch (error) {
        console.error("Broadcast Error:", error);
        res.status(500).json({ message: 'Failed to send broadcast', error });
    }
};

export const getSentNotifications = async (req: Request, res: Response) => {
    try {
        const sent = await Notification.findAll({
            attributes: [
                'title',
                'message',
                'type',
                [Sequelize.fn('MIN', Sequelize.col('createdAt')), 'createdAt'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            group: ['title', 'message', 'type'],
            order: [[Sequelize.fn('MIN', Sequelize.col('createdAt')), 'DESC']]
        });
        res.status(200).json(sent);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch sent notifications', error });
    }
};


