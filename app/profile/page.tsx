'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkSession } from '@/store/authSlice';
import { fetchProfile, fetchStats } from '@/store/profileSlice';
import { Navbar } from '@/components/Navbar';
import { getProgressToNextRank, RANKS } from '@/lib/utils/rankSystem';
import { supabase } from '@/lib/supabase';
import {
    PersonIcon,
    LightningBoltIcon,
    CalendarIcon,
    BarChartIcon,
    RocketIcon,
    StarFilledIcon,
    TargetIcon,
    TimerIcon,
    CheckCircledIcon,
    PieChartIcon,
} from '@radix-ui/react-icons';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

export default function ProfilePage() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state) => state.auth);
    const { profile, stats } = useAppSelector((state) => state.profile);

    const [chartData, setChartData] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [streakDays, setStreakDays] = useState(0);
    const [avgXpPerDay, setAvgXpPerDay] = useState(0);

    const categoryColors: Record<string, string> = {
        work: '#3b82f6',
        study: '#8b5cf6',
        health: '#10b981',
        personal: '#f59e0b',
    };

    const categoryLabels: Record<string, string> = {
        work: 'العمل',
        study: 'الدراسة',
        health: 'الصحة',
        personal: 'شخصي',
    };

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
            loadChartData(userId);
        };

        init();
    }, [dispatch, router]);

    const loadChartData = async (userId: string) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data } = await supabase
            .from('tasks')
            .select('end_time, xp, category')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('end_time', sevenDaysAgo.toISOString())
            .order('end_time', { ascending: true });

        if (data && data.length > 0) {
            // بيانات الرسم البياني اليومي
            const dayMap: Record<string, number> = {};
            const categoryMap: Record<string, number> = {};
            
            data.forEach((task) => {
                const date = new Date(task.end_time!).toLocaleDateString('ar-SA', { weekday: 'short' });
                dayMap[date] = (dayMap[date] || 0) + task.xp;
                
                // تجميع حسب الفئة
                categoryMap[task.category] = (categoryMap[task.category] || 0) + 1;
            });

            const chartArray = Object.entries(dayMap).map(([date, xp]) => ({
                date,
                xp,
            }));
            setChartData(chartArray);

            // بيانات الفئات للـ Pie Chart
            const catArray = Object.entries(categoryMap).map(([category, count]) => ({
                name: categoryLabels[category] || category,
                value: count,
                color: categoryColors[category] || '#64748b',
            }));
            setCategoryData(catArray);

            // حساب متوسط XP اليومي
            const totalXp = data.reduce((sum, t) => sum + t.xp, 0);
            setAvgXpPerDay(Math.round(totalXp / 7));

            // حساب streak (أيام متتالية)
            calculateStreak(userId);
        }
    };

    const calculateStreak = async (userId: string) => {
        const { data } = await supabase
            .from('tasks')
            .select('end_time')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('end_time', { ascending: false });

        if (data && data.length > 0) {
            let streak = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const uniqueDays = new Set(
                data.map(t => new Date(t.end_time!).toDateString())
            );

            for (let i = 0; i < 365; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                
                if (uniqueDays.has(checkDate.toDateString())) {
                    streak++;
                } else if (i > 0) {
                    break;
                }
            }
            setStreakDays(streak);
        }
    };

    if (!user || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <PersonIcon className="w-8 h-8 text-amber-400 animate-pulse" />
                    </div>
                    <p className="text-xl text-slate-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    const rankProgress = getProgressToNextRank(profile.total_xp);
    const rankIndex = RANKS.findIndex(r => r.name === rankProgress.currentRank.name);

    // Custom tooltip للرسم البياني
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-800 border border-slate-600 px-3 py-2 rounded-lg shadow-lg">
                    <p className="text-amber-400 font-bold">{payload[0].value} XP</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-900">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* رأس الصفحة */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3">
                        <PersonIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                        ملف المحارب
                    </h1>
                    <p className="text-slate-400">تتبع تقدمك وإحصائياتك</p>
                </div>

                {/* القسم العلوي: بطاقة الملف + الإحصائيات السريعة */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* بطاقة الملف الشخصي */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 p-6 rounded-2xl">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <PersonIcon className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1.5 text-amber-400 text-sm font-medium">
                                            <StarFilledIcon className="w-4 h-4" />
                                            {rankProgress.currentRank.name}
                                        </span>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-slate-300 text-sm">{profile.total_xp} XP</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* شريط التقدم نحو الرتبة التالية */}
                        {rankProgress.nextRank ? (
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">التقدم نحو {rankProgress.nextRank.name}</span>
                                    <span className="text-amber-400 font-medium">{Math.round(rankProgress.progress)}%</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2">
                                    <div
                                        className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full h-2.5 transition-all duration-500"
                                        style={{ width: `${rankProgress.progress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">{rankProgress.xpNeeded} XP متبقية للرتبة التالية</p>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-3 rounded-xl text-center">
                                <span className="text-amber-400 font-medium text-sm flex items-center justify-center gap-2">
                                    <StarFilledIcon className="w-4 h-4" />
                                    أعلى رتبة! أنت ملك الظلال!
                                </span>
                            </div>
                        )}

                        {/* مسار الرتب */}
                        <div className="mt-6 pt-6 border-t border-slate-700">
                            <p className="text-xs text-slate-500 mb-3">مسار الرتب</p>
                            <div className="flex items-center gap-1">
                                {RANKS.map((rank, i) => (
                                    <div key={rank.name} className="flex-1 flex flex-col items-center">
                                        <div 
                                            className={`w-full h-1.5 rounded-full ${
                                                i <= rankIndex 
                                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                                                    : 'bg-slate-700'
                                            }`}
                                        />
                                        {(i === 0 || i === rankIndex || i === RANKS.length - 1) && (
                                            <span className={`text-[10px] mt-1 ${i <= rankIndex ? 'text-amber-400' : 'text-slate-600'}`}>
                                                {rank.name.split(' ')[0]}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* الإحصائيات السريعة */}
                    <div className="space-y-4">
                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                <TimerIcon className="w-6 h-6 text-orange-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{streakDays}</div>
                                <div className="text-slate-400 text-sm">أيام متتالية 🔥</div>
                            </div>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <CheckCircledIcon className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.totalCompletedTasks}</div>
                                <div className="text-slate-400 text-sm">مهمة مكتملة</div>
                            </div>
                        </div>

                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                <TargetIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-white">{avgXpPerDay}</div>
                                <div className="text-slate-400 text-sm">متوسط XP يومياً</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* القسم السفلي: الرسوم البيانية */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* رسم XP اليومي */}
                    <div className="lg:col-span-2 bg-slate-800 border border-slate-700 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <BarChartIcon className="w-5 h-5 text-amber-400" />
                            نشاط XP خلال الأسبوع
                        </h3>
                        {chartData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <YAxis 
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="xp"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            fill="url(#xpGradient)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center">
                                <div className="text-center">
                                    <BarChartIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-500">لا توجد بيانات بعد</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* توزيع المهام حسب الفئة */}
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-amber-400" />
                            توزيع المهام
                        </h3>
                        {categoryData.length > 0 ? (
                            <>
                                <div className="h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-2 mt-4">
                                    {categoryData.map((cat, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-3 h-3 rounded-full" 
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                <span className="text-slate-300 text-sm">{cat.name}</span>
                                            </div>
                                            <span className="text-slate-400 text-sm">{cat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-48 flex items-center justify-center">
                                <div className="text-center">
                                    <PieChartIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-500">لا توجد بيانات</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
