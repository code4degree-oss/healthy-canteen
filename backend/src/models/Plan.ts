import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Plan extends Model {
    public id!: number;
    public name!: string;
    public slug!: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Plan.init(
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
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
    },
    {
        sequelize,
        tableName: 'plans',
    }
);

export default Plan;
