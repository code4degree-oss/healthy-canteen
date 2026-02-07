import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import Plan from './Plan';

class MenuItem extends Model {
    public id!: number;
    public planId!: number;
    public name!: string;
    public slug!: string;
    public description!: string;
    public proteinAmount!: number;
    public calories!: number;
    public price!: number;
    public image!: string;
    public color!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

MenuItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        planId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: Plan,
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        proteinAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        calories: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '#000000',
        },
    },
    {
        sequelize,
        tableName: 'menu_items',
    }
);

// Associations
Plan.hasMany(MenuItem, { foreignKey: 'planId', as: 'items' });
MenuItem.belongsTo(Plan, { foreignKey: 'planId' });

export default MenuItem;
