import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
// Subscription import removed to avoid circular dependency
import User from './User';

class DeliveryLog extends Model {
    public id!: number;
    public subscriptionId!: number;
    public userId!: number; // The delivery agent (or user if self-managed)
    public deliveryTime!: Date;
    public latitude!: number;
    public longitude!: number;
    public status!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

DeliveryLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        subscriptionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'subscriptions', // Use table name string to break circular dep
                key: 'id',
            },
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true, // Nullable if we don't strictly track agent IDs yet, but good practice
            references: {
                model: User,
                key: 'id',
            },
        },
        deliveryTime: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        latitude: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        longitude: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'PENDING', // PENDING -> ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED
        },
    },
    {
        sequelize,
        tableName: 'delivery_logs',
    }
);

// Associations
// Associations are defined in Subscription.ts

User.hasMany(DeliveryLog, { foreignKey: 'userId', as: 'deliveriesPerformed' });
DeliveryLog.belongsTo(User, { foreignKey: 'userId', as: 'deliveryAgent' });

export default DeliveryLog;
