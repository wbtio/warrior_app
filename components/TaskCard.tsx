'use client';

import { Task } from '@/store/tasksSlice';
import {
    DotsVerticalIcon,
    PlayIcon,
    CheckIcon,
    Cross2Icon,
    TrashIcon,
    ClockIcon,
    LightningBoltIcon,
    FileIcon,
} from '@radix-ui/react-icons';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

interface TaskCardProps {
    task: Task;
    onUpdate: (id: string, updates: Partial<Task>) => void;
    onDelete: (id: string) => void;
}

const categoryColors = {
    work: 'bg-orange-500',
    study: 'bg-blue-500',
    health: 'bg-emerald-500',
    personal: 'bg-purple-500',
};

const categoryLabels = {
    work: 'عمل',
    study: 'دراسة',
    health: 'صحة',
    personal: 'شخصي',
};

const statusLabels = {
    pending: 'قيد الانتظار',
    in_progress: 'جارية',
    completed: 'مكتملة',
    cancelled: 'ملغاة',
};

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
    const handleStatusChange = (newStatus: Task['status']) => {
        const updates: Partial<Task> = { status: newStatus };

        if (newStatus === 'in_progress' && !task.start_time) {
            updates.start_time = new Date().toISOString();
        }

        if (newStatus === 'completed' && !task.end_time) {
            updates.end_time = new Date().toISOString();
            updates.start_time = task.start_time || new Date().toISOString();
        }

        onUpdate(task.id, updates);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-SA', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1 flex gap-4">
                    {/* نقطة الفئة */}
                    <div className={`w-3 h-3 rounded-full ${categoryColors[task.category]} mt-2 flex-shrink-0`} />

                    {/* المحتوى الرئيسي */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-white">{task.title}</h3>
                            {task.task_type === 'main' && (
                                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-medium">
                                    رئيسية
                                </span>
                            )}
                        </div>

                        {task.description && (
                            <p className="text-slate-400 text-sm mb-3">{task.description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <FileIcon className="w-3 h-3" />
                                {categoryLabels[task.category]}
                            </span>
                            {task.start_time && (
                                <span className="flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    {formatDate(task.start_time)}
                                </span>
                            )}
                            {task.xp > 0 && (
                                <span className="flex items-center gap-1 font-bold text-amber-400">
                                    <LightningBoltIcon className="w-3 h-3" />
                                    {task.xp} XP
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* القائمة المنسدلة */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white">
                            <DotsVerticalIcon className="w-5 h-5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                            onClick={() => handleStatusChange('in_progress')}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                            <PlayIcon className="w-4 h-4 ml-2" />
                            بدء المهمة
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleStatusChange('completed')}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                            <CheckIcon className="w-4 h-4 ml-2" />
                            إكمال المهمة
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleStatusChange('cancelled')}
                            className="text-slate-300 hover:text-white hover:bg-slate-700"
                        >
                            <Cross2Icon className="w-4 h-4 ml-2" />
                            إلغاء المهمة
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem
                            onClick={() => onDelete(task.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            <TrashIcon className="w-4 h-4 ml-2" />
                            حذف
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* حالة المهمة */}
            <div className="mt-4 pt-4 border-t border-slate-700">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        task.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700 text-slate-400'
                    }`}>
                    {task.status === 'completed' && <CheckIcon className="w-3 h-3" />}
                    {task.status === 'in_progress' && <PlayIcon className="w-3 h-3" />}
                    {task.status === 'cancelled' && <Cross2Icon className="w-3 h-3" />}
                    {statusLabels[task.status]}
                </span>
            </div>
        </div>
    );
}
