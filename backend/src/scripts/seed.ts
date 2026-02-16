import sequelize from '../config/database';
import User from '../models/User';
import Plan from '../models/Plan';
import MenuItem from '../models/MenuItem';
import AddOn from '../models/AddOn';
import Order from '../models/Order';
import Subscription from '../models/Subscription';
import bcrypt from 'bcryptjs';

const seed = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // FORCE SYNC (WIPES DATA)
        await sequelize.sync({ force: true });
        console.log('Database wiped and synced.');

        // 1. Create Admin
        const adminHash = await bcrypt.hash('admin', 10);
        await User.create({
            name: 'Super Admin',
            email: 'admin@gmail.com',
            password: adminHash,
            role: 'admin',
            phone: '9999999999',
            address: 'Admin HQ, Pune'
        });
        console.log('Admin user created.');

        // 2. Create Default Plans & Menu Items
        const mealPlan = await Plan.create({
            name: 'MEAL',
            slug: 'MEAL'
        });

        await MenuItem.bulkCreate([
            {
                planId: mealPlan.id,
                name: "Chicken Meal",
                slug: "CHICKEN_MEAL",
                calories: 730,
                protein: 60,
                description: "250g Raw ≈ 200g Cooked. Herb Grilled, Peri-Peri, Lemon Pepper, Cajun, or Light Tandoori.",
                image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=800&auto=format&fit=crop",
                price: 320,
                type: 'CHICKEN',
                sortOrder: 1
            },
            {
                planId: mealPlan.id,
                name: "Paneer Meal",
                slug: "PANEER_MEAL",
                calories: 900,
                protein: 40,
                description: "200g Fresh Paneer. Naturally higher in fats. Prepared in various rotational styles.",
                image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800&auto=format&fit=crop",
                price: 300,
                type: 'PANEER',
                sortOrder: 2
            },
            {
                planId: mealPlan.id,
                name: "Vegan Meal",
                slug: "VEGAN_MEAL",
                calories: 650,
                protein: 30,
                description: "Plant-based goodness. Tofu, lentils, beans, and fresh veggies.",
                image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
                price: 280,
                type: 'VEGAN',
                sortOrder: 3
            }
        ]);
        console.log('Menu items seeded.');

        // 3. Create Default Add-Ons
        await AddOn.create({
            name: "Probiotic Kefir (275ml)",
            price: 99,
            description: "Naturally fermented, gut-healthy.",
            allowSubscription: true,
            image: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?q=80&w=800&auto=format&fit=crop"
        });
        console.log('Add-ons seeded.');

        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
