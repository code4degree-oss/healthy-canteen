import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Subscription from './Subscription';

class SubscriptionPause extends Model {
    public id!: number;
    public subscriptionId!: number;
    public startDate!: Date;
    public endDate!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

SubscriptionPause.init(
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
                model: Subscription,
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
    },
    {
        sequelize,
        tableName: 'subscription_pauses',
    }
);

Subscription.hasMany(SubscriptionPause, { foreignKey: 'subscriptionId', as: 'pauses' });
SubscriptionPause.belongsTo(Subscription, { foreignKey: 'subscriptionId' });

export default SubscriptionPause;
