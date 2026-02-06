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
    },
    {
        sequelize,
        tableName: 'orders',
    }
);

// Define Association
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

export default Order;
