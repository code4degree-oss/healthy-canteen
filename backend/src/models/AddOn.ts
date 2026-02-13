import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class AddOn extends Model {
    public id!: number;
    public name!: string;
    public price!: number;
    public description!: string;
    public image!: string;
    public thumbnail!: string;
    public allowSubscription!: boolean;
}

AddOn.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    allowSubscription: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    sequelize,
    tableName: 'add_ons',
});

export default AddOn;
