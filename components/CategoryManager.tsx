'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/Dialog';
import { Cross2Icon, PlusIcon, Pencil1Icon, TrashIcon, CheckIcon } from '@radix-ui/react-icons';

export interface Category {
    id: string;
    name: string;
    nameAr: string;
    color: string;
}

// الألوان المتاحة (12-13 لون مميز)
export const CATEGORY_COLORS = [
    '#f97316', // orange
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // purple
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#ec4899', // pink
    '#84cc16', // lime
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f43f5e', // rose
    '#a855f7', // violet
];

// الفئات الافتراضية
export const DEFAULT_CATEGORIES: Category[] = [
    { id: 'work', name: 'work', nameAr: 'عمل', color: '#f97316' },
    { id: 'study', name: 'study', nameAr: 'دراسة', color: '#3b82f6' },
    { id: 'health', name: 'health', nameAr: 'صحة', color: '#10b981' },
    { id: 'personal', name: 'personal', nameAr: 'شخصي', color: '#8b5cf6' },
];

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onCategoriesChange: (categories: Category[]) => void;
}

export function CategoryManager({
    isOpen,
    onClose,
    categories,
    onCategoriesChange,
}: CategoryManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
    const [showAddForm, setShowAddForm] = useState(false);

    const handleStartEdit = (category: Category) => {
        setEditingId(category.id);
        setEditName(category.nameAr);
        setEditColor(category.color);
    };

    const handleSaveEdit = () => {
        if (!editingId || !editName.trim()) return;

        const updated = categories.map((cat) =>
            cat.id === editingId
                ? { ...cat, nameAr: editName.trim(), color: editColor }
                : cat
        );
        onCategoriesChange(updated);
        setEditingId(null);
        setEditName('');
        setEditColor('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditColor('');
    };

    const handleDelete = (id: string) => {
        // لا نسمح بحذف الفئات الافتراضية
        const defaultIds = DEFAULT_CATEGORIES.map((c) => c.id);
        if (defaultIds.includes(id)) return;

        const updated = categories.filter((cat) => cat.id !== id);
        onCategoriesChange(updated);
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;

        const newId = `custom_${Date.now()}`;
        const newCategory: Category = {
            id: newId,
            name: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
            nameAr: newCategoryName.trim(),
            color: newCategoryColor,
        };

        onCategoriesChange([...categories, newCategory]);
        setNewCategoryName('');
        setNewCategoryColor(CATEGORY_COLORS[0]);
        setShowAddForm(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
                <DialogHeader className="flex flex-row justify-between items-center mb-4">
                    <DialogTitle className="text-white">إدارة الفئات</DialogTitle>
                    <DialogClose className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <Cross2Icon className="w-5 h-5" />
                    </DialogClose>
                </DialogHeader>

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700"
                        >
                            {editingId === category.id ? (
                                // وضع التعديل
                                <>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            placeholder="اسم الفئة"
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {CATEGORY_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setEditColor(color)}
                                                    className={`w-6 h-6 rounded-full transition-all ${editColor === color
                                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                                                        : 'hover:scale-110'
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={handleSaveEdit}
                                            className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                        >
                                            <CheckIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <Cross2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // وضع العرض
                                <>
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="flex-1 font-medium">{category.nameAr}</span>
                                    <div className="flex gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(category)}
                                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition-colors"
                                        >
                                            <Pencil1Icon className="w-4 h-4" />
                                        </button>
                                        {!DEFAULT_CATEGORIES.find((c) => c.id === category.id) && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(category.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {/* إضافة فئة جديدة */}
                {showAddForm ? (
                    <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            placeholder="اسم الفئة الجديدة"
                            autoFocus
                        />
                        <div className="flex flex-wrap gap-2">
                            {CATEGORY_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setNewCategoryColor(color)}
                                    className={`w-6 h-6 rounded-full transition-all ${newCategoryColor === color
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                                        : 'hover:scale-110'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                disabled={!newCategoryName.trim()}
                                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                إضافة
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setNewCategoryName('');
                                }}
                                className="px-4 py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-amber-400 hover:border-amber-500 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        إضافة فئة جديدة
                    </button>
                )}
            </DialogContent>
        </Dialog>
    );
}
