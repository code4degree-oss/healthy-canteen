import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
    public id!: number;
    public name!: string;
    public email!: string;
    public password!: string;
    public address!: string;
    public phone!: string;
    public role!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: 'client', // 'client', 'admin', 'delivery'
        },
    },
    {
        sequelize,
        tableName: 'users',
    }
);

export default User;
