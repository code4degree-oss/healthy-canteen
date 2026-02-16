import sequelize from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'admin@gmail.com';
        const password = 'admin'; // Default password

        // Check if admin exists
        const existingAdmin = await User.findOne({ where: { email } });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists.');
            process.exit(0);
        }

        // Create Admin
        const adminHash = await bcrypt.hash(password, 10);
        await User.create({
            name: 'Super Admin',
            email: email,
            password: adminHash,
            role: 'admin',
            phone: '9999999999',
            address: 'Admin HQ'
        });

        console.log('✅ Admin user created successfully!');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create admin:', error);
        process.exit(1);
    }
};

createAdmin();
