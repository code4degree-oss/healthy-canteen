import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Order from './Order';

class Subscription extends Model {
    public id!: number;
    public userId!: number;
    public orderId!: number;
    public startDate!: Date;
    public endDate!: Date;
    public status!: string; // ACTIVE, PAUSED, EXPIRED
    public daysRemaining!: number;
    public pausesRemaining!: number;
    public protein!: string;
    public mealsPerDay!: number;
    public deliveryAddress!: string;
    public addons!: any;
    public cancellationReason!: string | null;
    public lastPausedAt!: Date | null;
    public mealTypes!: string[];
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Subscription.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: User,
                key: 'id',
            },
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Order,
                key: 'id',
            },
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        deliveryAddress: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'ACTIVE',
        },
        daysRemaining: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        protein: {
            type: DataTypes.STRING,
            allowNull: false
        },
        mealsPerDay: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        pausesRemaining: {
            type: DataTypes.INTEGER,
            defaultValue: 3
        },
        addons: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        mealTypes: {
            type: DataTypes.JSON, // ['LUNCH'], ['DINNER'], or ['LUNCH', 'DINNER']
            allowNull: false,
            defaultValue: ['LUNCH']
        },
        cancellationReason: {
            type: DataTypes.STRING,
            allowNull: true
        },
        lastPausedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    },
    {
        sequelize,
        modelName: 'Subscription',
        tableName: 'subscriptions',
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['status']
            }
        ]
    }
);

// Associations
User.hasMany(Subscription, { foreignKey: 'userId', as: 'subscriptions' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

Order.hasOne(Subscription, { foreignKey: 'orderId' });
Subscription.belongsTo(Order, { foreignKey: 'orderId' });

import DeliveryLog from './DeliveryLog';
Subscription.hasMany(DeliveryLog, { foreignKey: 'subscriptionId', as: 'deliveryLogs' });
DeliveryLog.belongsTo(Subscription, { foreignKey: 'subscriptionId' }); // Defined here to avoid circular dep

export default Subscription;
