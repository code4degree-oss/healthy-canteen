import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableMenuItem } from './SortableMenuItem';

interface MenuItem {
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
}

interface SortableMenuTableProps {
    items: MenuItem[];
    onReorder: (items: MenuItem[]) => void;
    onEdit: (item: MenuItem) => void;
    onDelete: (id: number) => void;
}

export const SortableMenuTable: React.FC<SortableMenuTableProps> = ({
    items,
    onReorder,
    onEdit,
    onDelete,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            const reorderedItems = arrayMove(items, oldIndex, newIndex);

            // Update sortOrder for each item
            const updatedItems = reorderedItems.map((item, index) =>
                Object.assign({}, item, { sortOrder: index })
            );

            onReorder(updatedItems);
        }
    };

    if (!items || items.length === 0) {
        return (
            <div className="p-6 text-center text-slate-400 text-sm">
                No items in this plan yet.
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <table className="w-full text-left min-w-[800px]">
                <thead className="bg-white text-xs font-semibold text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                        <th className="p-3 w-10"></th>
                        <th className="px-4 py-3">Image</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Stats</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    <SortableContext
                        items={items.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {items.map((item) => (
                            <SortableMenuItem
                                key={item.id}
                                item={item}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </SortableContext>
                </tbody>
            </table>
        </DndContext>
    );
};
