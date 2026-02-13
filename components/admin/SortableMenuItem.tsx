import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2 } from 'lucide-react';
import { BASE_URL } from '../../src/services/api';

interface SortableMenuItemProps {
    item: {
        id: number;
        name: string;
        slug: string;
        description: string;
        proteinAmount: number;
        calories: number;
        price: number;
        image: string;
        images?: string[];
        sortOrder?: number;
    };
    onEdit: (item: any) => void;
    onDelete: (id: number) => void;
}

export const SortableMenuItem: React.FC<SortableMenuItemProps> = ({ item, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`border-b border-gray-100 hover:bg-gray-50 ${isDragging ? 'bg-blue-50 shadow-lg' : ''}`}
        >
            {/* Drag Handle */}
            <td className="p-3 w-10">
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 cursor-grab hover:bg-gray-200 rounded transition-colors active:cursor-grabbing"
                    title="Drag to reorder"
                >
                    <GripVertical size={18} className="text-gray-400" />
                </button>
            </td>

            {/* Image */}
            <td className="p-3 w-20">
                {item.image ? (
                    <img
                        src={`${BASE_URL}${item.image}`}
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                    />
                ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">
                        No Img
                    </div>
                )}
            </td>

            {/* Name & Slug */}
            <td className="p-3">
                <div className="font-semibold text-gray-800">{item.name}</div>
                <div className="text-xs text-gray-400">{item.slug}</div>
            </td>

            {/* Stats */}
            <td className="p-3">
                <div className="text-sm text-gray-600">{item.calories} kCal</div>
                <div className="text-xs text-gray-400">{item.proteinAmount}g Protein</div>
            </td>

            {/* Description */}
            <td className="p-3 max-w-[200px]">
                <div className="text-sm text-gray-600 truncate">{item.description}</div>
            </td>

            {/* Price */}
            <td className="p-3">
                <span className="font-bold text-gray-800">₹{item.price}</span>
            </td>

            {/* Actions */}
            <td className="p-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};
