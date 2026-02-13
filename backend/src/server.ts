import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import adminRoutes from './routes/adminRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import menuRoutes from './routes/menuRoutes';
import settingsRoutes from './routes/settingsRoutes';
import path from 'path';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

// CORS - strict in production, flexible in dev
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: isDev ? true : allowedOrigins,
    credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/subscriptions', require('./routes/subscriptionRoutes').default);
app.use('/api/notifications', require('./routes/notificationRoutes').default);

// Serve static files 
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve uploads directory

app.get('/', (req: Request, res: Response) => {
    res.send('The Healthy Canteen Backend is running!');
});

const startServer = async () => {
    try {
        // Warn if JWT_SECRET is using fallback
        if (!process.env.JWT_SECRET) {
            console.warn('⚠️  WARNING: JWT_SECRET not set in .env! Using insecure fallback. Set it before deploying to production.');
        }

        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Only auto-alter tables in development
        if (isDev) {
            await sequelize.sync({ alter: true });
        } else {
            await sequelize.sync();
        }

        // Seed default settings (outlet location, radius)
        const { seedDefaults } = require('./models/Settings');
        await seedDefaults();

        app.listen(port, () => {
            console.log(`Server is running on port ${port} (${isDev ? 'development' : 'production'})`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
