import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Settings extends Model {
    public id!: number;
    public key!: string;
    public value!: string;
}

Settings.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'settings',
    }
);

// Seed defaults if not present
export const seedDefaults = async () => {
    const defaults: Record<string, string> = {
        outletLat: '18.654949627383616',
        outletLng: '73.84475261136429',
        serviceRadiusKm: '5',
    };

    for (const [key, value] of Object.entries(defaults)) {
        await Settings.findOrCreate({ where: { key }, defaults: { key, value } });
    }
};

export default Settings;
