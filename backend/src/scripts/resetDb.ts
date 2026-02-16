import sequelize from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Import other models to ensure associations are registered
import '../models/Order';
import '../models/MenuItem';
import '../models/DeliveryLog';
import '../models/Notification';
import '../models/Plan';
import '../models/Subscription';
import '../models/SubscriptionPause';
import '../models/AddOn';

// Import Settings seeder
const { seedDefaults } = require('../models/Settings');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const resetDb = async () => {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected.');

        console.log('⚠️  Resetting database (FORCE SYNC)...');
        await sequelize.sync({ force: true });
        console.log('✅ Database reset complete.');

        console.log('🌱 Seeding admin user...');
        const adminPassword = await bcrypt.hash('admin', 10);

        await User.create({
            name: 'Admin User',
            email: 'admin@gmail.com',
            password: adminPassword,
            role: 'admin',
            phone: '1234567890',
            address: 'Admin HQ'
        });
        console.log('✅ Admin user created: admin@gmail.com / admin');

        console.log('🌱 Seeding default settings...');
        await seedDefaults();
        console.log('✅ Default settings seeded.');

        console.log('🎉 Database reset and seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        process.exit(1);
    }
};

resetDb();
