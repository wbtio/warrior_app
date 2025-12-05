'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkSession } from '@/store/authSlice';
import { fetchProfile } from '@/store/profileSlice';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/store/tasksSlice';
import {
    ArchiveIcon,
    MagnifyingGlassIcon,
    CheckCircledIcon,
    LightningBoltIcon,
    RocketIcon,
} from '@radix-ui/react-icons';

const categoryLabels = {
    work: 'عمل',
    study: 'دراسة',
    health: 'صحة',
    personal: 'شخصي',
};

const categoryColors = {
    work: 'bg-orange-500',
    study: 'bg-blue-500',
    health: 'bg-emerald-500',
    personal: 'bg-purple-500',
};

export default function ArchivePage() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state) => state.auth);
    const { profile } = useAppSelector((state) => state.profile);

    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'work' | 'study' | 'health' | 'personal'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const init = async () => {
            const sessionResult = await dispatch(checkSession());

            if (!sessionResult.payload) {
                router.push('/auth/login');
                return;
            }

            const userId = (sessionResult.payload as any).id;
            dispatch(fetchProfile(userId));
            loadCompletedTasks(userId);
        };

        init();
    }, [dispatch, router]);

    const loadCompletedTasks = async (userId: string) => {
        setLoading(true);

        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('end_time', { ascending: false });

        if (error) {
            console.error('Error loading completed tasks:', error);
        } else {
            setCompletedTasks(data as Task[]);
        }

        setLoading(false);
    };

    const filteredTasks = completedTasks.filter((task) => {
        const matchesFilter = filter === 'all' || task.category === filter;
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesFilter && matchesSearch;
    });

    const totalXP = filteredTasks.reduce((sum, task) => sum + task.xp, 0);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const calculateDuration = (start: string | null, end: string | null) => {
        if (!start || !end) return '-';
        const durationMs = new Date(end).getTime() - new Date(start).getTime();
        const minutes = Math.floor(durationMs / (1000 * 60));

        if (minutes < 60) return `${minutes} دقيقة`;
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} ساعة ${remainingMinutes > 0 ? `و ${remainingMinutes} دقيقة` : ''}`;
    };

    if (!user || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ArchiveIcon className="w-8 h-8 text-amber-400 animate-pulse" />
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
                {/* رأس الصفحة */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3">
                        <ArchiveIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                        أرشيف المحارب
                    </h1>
                    <p className="text-slate-400">جميع المهام المكتملة</p>
                </div>

                {/* إحصائيات سريعة */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <div className="bg-slate-800 border border-slate-700 p-4 sm:p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                <CheckCircledIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-slate-400 text-sm mb-1">إجمالي المهام المكتملة</div>
                        <div className="text-3xl sm:text-4xl font-bold text-white">{filteredTasks.length}</div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 p-4 sm:p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                <LightningBoltIcon className="w-5 h-5 text-amber-400" />
                            </div>
                        </div>
                        <div className="text-slate-400 text-sm mb-1">إجمالي XP المكتسب</div>
                        <div className="text-3xl sm:text-4xl font-bold text-amber-400">{totalXP}</div>
                    </div>
                    <div className="bg-slate-800 border border-slate-700 p-4 sm:p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <RocketIcon className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                        <div className="text-slate-400 text-sm mb-1">متوسط XP لكل مهمة</div>
                        <div className="text-3xl sm:text-4xl font-bold text-white">
                            {filteredTasks.length > 0 ? Math.round(totalXP / filteredTasks.length) : 0}
                        </div>
                    </div>
                </div>

                {/* البحث والفلاتر */}
                <div className="mb-6 space-y-4">
                    {/* البحث */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث في المهام..."
                            className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>

                    {/* الفلاتر */}
                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${filter === 'all'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                }`}
                        >
                            الكل ({completedTasks.length})
                        </button>
                        {(['work', 'study', 'health', 'personal'] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap ${filter === cat
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                                    }`}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full ${categoryColors[cat]}`} />
                                {categoryLabels[cat]} ({completedTasks.filter(t => t.category === cat).length})
                            </button>
                        ))}
                    </div>
                </div>

                {/* قائمة المهام */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <ArchiveIcon className="w-6 h-6 text-slate-500 animate-pulse" />
                        </div>
                        <p className="text-lg text-slate-500">جاري التحميل...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-16 bg-slate-800/50 border border-slate-700 border-dashed rounded-xl">
                        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <ArchiveIcon className="w-10 h-10 text-slate-600" />
                        </div>
                        <p className="text-xl text-slate-400">
                            {searchQuery || filter !== 'all' ? 'لا توجد مهام مطابقة' : 'لم تكمل أي مهمة بعد'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-slate-800 rounded-lg px-4 py-3 flex gap-3"
                            >
                                {/* أيقونة الحالة */}
                                <div className="mt-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white flex-shrink-0">
                                    ✓
                                </div>

                                {/* المحتوى */}
                                <div className="flex-1 space-y-1">
                                    {/* العنوان */}
                                    <h3 className="font-bold text-white text-sm">{task.title}</h3>

                                    {/* التصنيف + XP */}
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] text-white ${categoryColors[task.category]}`}>
                                            {categoryLabels[task.category]}
                                        </span>
                                        <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] text-white">
                                            XP {task.xp}
                                        </span>
                                    </div>

                                    {/* الوصف */}
                                    {task.description && (
                                        <p className="text-xs text-slate-300 line-clamp-2">{task.description}</p>
                                    )}

                                    {/* التاريخ + الوقت */}
                                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                        <span>{formatDate(task.end_time)}</span>
                                        <span>•</span>
                                        <span>{calculateDuration(task.start_time, task.end_time)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
