import MenuItem from '../models/MenuItem';
import sequelize from '../config/database';

const reset = async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB. Resetting MenuItem table...");
        await MenuItem.sync({ force: true });
        console.log("MenuItem table reset successfully.");
    } catch (err) {
        console.error("Error resetting table:", err);
    } finally {
        await sequelize.close();
        process.exit();
    }
};

reset();
