import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class MenuItem extends Model {
    public id!: number;
    public name!: string;
    public calories!: number;
    public protein!: number;
    public description!: string;
    public image!: string;
    public price!: number; // Base price implementation
    public type!: string; // CHICKEN or PANEER
}

MenuItem.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    calories: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    protein: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    type: {
        type: DataTypes.ENUM('CHICKEN', 'PANEER'),
        allowNull: false,
    },
}, {
    sequelize,
    tableName: 'menu_items',
});

export default MenuItem;
