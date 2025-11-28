'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkSession } from '@/store/authSlice';
import { fetchTasks, createTask, updateTask, deleteTask, type Task } from '@/store/tasksSlice';
import { fetchProfile, fetchStats } from '@/store/profileSlice';
import { Navbar } from '@/components/Navbar';
import { TaskCard } from '@/components/TaskCard';
import { AddTaskModal } from '@/components/AddTaskModal';
import {
    RocketIcon,
    CalendarIcon,
    BarChartIcon,
    StarIcon,
    LockClosedIcon,
    LockOpen1Icon,
    PlusIcon,
} from '@radix-ui/react-icons';

export default function BattlefieldPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state) => state.auth);
    const { tasks, loading } = useAppSelector((state) => state.tasks);
    const { profile, stats } = useAppSelector((state) => state.profile);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress'>('all');

    useEffect(() => {
        const init = async () => {
            const sessionResult = await dispatch(checkSession());

            if (!sessionResult.payload) {
                router.push('/auth/login');
                return;
            }

            const userId = (sessionResult.payload as any).id;
            dispatch(fetchProfile(userId));
            dispatch(fetchStats(userId));
            dispatch(fetchTasks(userId));
        };

        init();
    }, [dispatch, router]);

    const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'xp'>) => {
        await dispatch(createTask(taskData));
        if (user) {
            dispatch(fetchStats(user.id));
        }
    };

    const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
        await dispatch(updateTask({ id, updates }));
        if (user) {
            dispatch(fetchProfile(user.id));
            dispatch(fetchStats(user.id));
        }
    };

    const handleDeleteTask = async (id: string) => {
        await dispatch(deleteTask(id));
    };

    const filteredTasks = tasks.filter((task) => {
        if (filter === 'all') return true;
        return task.status === filter;
    });

    if (!user || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <RocketIcon className="w-8 h-8 text-amber-400 animate-pulse" />
                    </div>
                    <p className="text-xl text-slate-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        مرحباً، {profile.name}
                    </h1>
                    <p className="text-slate-400 text-base sm:text-lg">
                        {profile.rank} • {profile.total_xp} XP
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-slate-800 border border-slate-700 p-4 sm:p-5 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <CalendarIcon className="w-5 h-5 text-blue-400" />
                            </div>
                        </div>
                        <div className="text-sm text-slate-400 mb-1">مهام اليوم</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">{stats.completedTasksToday}</div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-4 sm:p-5 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <BarChartIcon className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                        <div className="text-sm text-slate-400 mb-1">مهام الأسبوع</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">{stats.completedTasksThisWeek}</div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 p-4 sm:p-5 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                <RocketIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-sm text-slate-400 mb-1">إجمالي المهام</div>
                        <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalCompletedTasks}</div>
                    </div>

                    <div className={`p-5 rounded-xl border ${stats.canUnlockThroneRoom
                        ? 'bg-amber-500/10 border-amber-500/50'
                        : 'bg-slate-800 border-slate-700'
                        }`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats.canUnlockThroneRoom ? 'bg-amber-500/20' : 'bg-slate-700'
                                }`}>
                                {stats.canUnlockThroneRoom
                                    ? <LockOpen1Icon className="w-5 h-5 text-amber-400" />
                                    : <LockClosedIcon className="w-5 h-5 text-slate-500" />
                                }
                            </div>
                        </div>
                        <div className="text-sm text-slate-400 mb-1">قاعة العرش</div>
                        <div className={`text-xl font-bold ${stats.canUnlockThroneRoom ? 'text-amber-400' : 'text-slate-500'}`}>
                            {stats.canUnlockThroneRoom ? 'مفتوحة!' : 'مغلقة'}
                        </div>
                    </div>
                </div>

                {/* Filters & Add Button */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${filter === 'all'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                }`}
                        >
                            الكل ({tasks.length})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${filter === 'pending'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                }`}
                        >
                            قيد الانتظار ({tasks.filter(t => t.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setFilter('in_progress')}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${filter === 'in_progress'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                }`}
                        >
                            جارية ({tasks.filter(t => t.status === 'in_progress').length})
                        </button>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg shadow-amber-500/20 w-full sm:w-auto"
                    >
                        <PlusIcon className="w-5 h-5" />
                        مهمة جديدة
                    </button>
                </div>

                {/* Tasks Grid */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <RocketIcon className="w-6 h-6 text-slate-500 animate-pulse" />
                        </div>
                        <p className="text-lg text-slate-500">جاري تحميل المهام...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <RocketIcon className="w-10 h-10 text-slate-600" />
                        </div>
                        <p className="text-xl text-slate-400 mb-2">
                            {filter === 'all' ? 'لا توجد مهام بعد' : 'لا توجد مهام بهذا التصنيف'}
                        </p>
                        <p className="text-slate-600">
                            {filter === 'all' && 'ابدأ بإضافة مهمة جديدة للبدء!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onUpdate={handleUpdateTask}
                                onDelete={handleDeleteTask}
                            />
                        ))}
                    </div>
                )}
            </main>

            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateTask}
                userId={user.id}
            />
        </div>
    );
}
