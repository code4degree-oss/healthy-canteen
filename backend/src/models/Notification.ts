import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

class Notification extends Model {
    public id!: number;
    public userId!: number;
    public title!: string;
    public message!: string;
    public type!: 'info' | 'delivery' | 'alert' | 'success';
    public isRead!: boolean;
    public readonly createdAt!: Date;
}

Notification.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('info', 'delivery', 'alert', 'success'),
        defaultValue: 'info'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications', // Explicit table name
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['isRead']
        }
    ]
});

// Association
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });

export default Notification;
