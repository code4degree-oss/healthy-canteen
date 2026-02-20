import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class Order extends Model {
    public id!: number;
    public userId!: number;
    public protein!: string;
    public days!: number;
    public mealsPerDay!: number;
    public totalPrice!: number;
    public status!: string; // PENDING, PAID, FAILED
    public startDate!: Date;
    public deliveryLat!: number;
    public deliveryLng!: number;
    public deliveryAddress!: string;
    public mealTypes!: any; // JSON array
    public addons!: any;
    public notes!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Order.init(
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
        protein: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        days: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        mealsPerDay: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        totalPrice: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            defaultValue: 'PENDING',
        },
        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        deliveryLat: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        deliveryLng: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        deliveryAddress: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        addons: {
            type: DataTypes.JSON, // Stores array of selected addons
            allowNull: true
        },
        mealTypes: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: ['LUNCH']
        },
        notes: {
            type: DataTypes.STRING,
            allowNull: true
        },
    },
    {
        sequelize,
        modelName: 'Order',
        tableName: 'orders',
        indexes: [
            {
                fields: ['userId']
            },
            {
                fields: ['createdAt']
            }
        ]
    }
);

// Define Association
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Order;
