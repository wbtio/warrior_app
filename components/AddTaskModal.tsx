'use client';

import { useState } from 'react';
import { Task } from '@/store/tasksSlice';
import { estimateXP } from '@/lib/utils/xpCalculator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/Dialog';
import {
    Cross2Icon,
    RocketIcon,
    LightningBoltIcon,
} from '@radix-ui/react-icons';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'xp'>) => void;
    userId: string;
}

const categoryColors = {
    work: 'bg-orange-500',
    study: 'bg-blue-500',
    health: 'bg-emerald-500',
    personal: 'bg-purple-500',
};

export function AddTaskModal({ isOpen, onClose, onSubmit, userId }: AddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Task['category']>('work');
    const [taskType, setTaskType] = useState<Task['task_type']>('main');
    const [estimatedMinutes, setEstimatedMinutes] = useState(60);

    const estimatedXP = estimateXP(estimatedMinutes, taskType);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onSubmit({
            user_id: userId,
            title,
            description: description || null,
            category,
            task_type: taskType,
            difficulty_factor: taskType === 'main' ? 4.0 : 2.0,
            start_time: null,
            end_time: null,
            status: 'pending',
        });

        // إعادة تعيين النموذج
        setTitle('');
        setDescription('');
        setCategory('work');
        setTaskType('main');
        setEstimatedMinutes(60);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
                {/* العنوان */}
                <DialogHeader className="flex flex-row justify-between items-center mb-6">
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <RocketIcon className="w-6 h-6 text-amber-400" />
                        مهمة جديدة
                    </DialogTitle>
                    <DialogClose className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors">
                        <Cross2Icon className="w-5 h-5" />
                    </DialogClose>
                </DialogHeader>

                {/* النموذج */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* العنوان */}
                    <div>
                        <label className="block font-medium mb-2 text-slate-300">عنوان المهمة *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="مثال: إكمال تقرير المشروع"
                        />
                    </div>

                    {/* الوصف */}
                    <div>
                        <label className="block font-medium mb-2 text-slate-300">الوصف (اختياري)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="أضف تفاصيل إضافية..."
                        />
                    </div>

                    {/* الفئة */}
                    <div>
                        <label className="block font-medium mb-3 text-slate-300">الفئة *</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['work', 'study', 'health', 'personal'] as const).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all ${category === cat
                                        ? 'border-amber-500 bg-amber-500/10'
                                        : 'border-slate-600 hover:border-slate-500 bg-slate-900'
                                        }`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${categoryColors[cat]}`} />
                                    <span className="font-medium text-slate-200">
                                        {cat === 'work' && 'عمل'}
                                        {cat === 'study' && 'دراسة'}
                                        {cat === 'health' && 'صحة'}
                                        {cat === 'personal' && 'شخصي'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* نوع المهمة */}
                    <div>
                        <label className="block font-medium mb-3 text-slate-300">نوع المهمة *</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setTaskType('main')}
                                className={`flex-1 px-4 py-3 border rounded-xl font-medium transition-all ${taskType === 'main'
                                    ? 'border-amber-500 bg-amber-500 text-white'
                                    : 'border-slate-600 hover:border-slate-500 bg-slate-900 text-slate-300'
                                    }`}
                            >
                                <RocketIcon className="w-4 h-4 inline ml-2" />
                                رئيسية (×4 XP)
                            </button>
                            <button
                                type="button"
                                onClick={() => setTaskType('side')}
                                className={`flex-1 px-4 py-3 border rounded-xl font-medium transition-all ${taskType === 'side'
                                    ? 'border-amber-500 bg-amber-500 text-white'
                                    : 'border-slate-600 hover:border-slate-500 bg-slate-900 text-slate-300'
                                    }`}
                            >
                                جانبية (×2 XP)
                            </button>
                        </div>
                    </div>

                    {/* الوقت المقدّر */}
                    <div>
                        <label className="block font-medium mb-2 text-slate-300">
                            الوقت المقدّر (دقائق)
                        </label>
                        <input
                            type="number"
                            value={estimatedMinutes}
                            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                            min={1}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>

                    {/* عرض XP المتوقع */}
                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-4 rounded-xl text-center">
                        <div className="text-sm mb-1 text-slate-300">XP المتوقع عند الإكمال:</div>
                        <div className="text-3xl font-bold text-amber-400 flex items-center justify-center gap-2">
                            <LightningBoltIcon className="w-6 h-6" />
                            {estimatedXP} XP
                        </div>
                    </div>

                    {/* أزرار */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors font-semibold text-slate-300"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg shadow-amber-500/20"
                        >
                            إنشاء المهمة
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
