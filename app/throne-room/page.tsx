'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkSession } from '@/store/authSlice';
import { fetchProfile, fetchStats } from '@/store/profileSlice';
import { createTask } from '@/store/tasksSlice';
import { Navbar } from '@/components/Navbar';
import {
    StarIcon,
    LockClosedIcon,
    RocketIcon,
    LightningBoltIcon,
    CheckCircledIcon,
    Cross2Icon,
    ReloadIcon,
    TargetIcon,
    SpeakerLoudIcon,
    PersonIcon,
} from '@radix-ui/react-icons';
import type { RoyalQuest, MotivationMessage } from '@/lib/ai/kingAgent';


const REQUIRED_TASKS = 3;

const categoryLabels: Record<string, string> = {
    work: 'عمل',
    study: 'دراسة',
    health: 'صحة',
    personal: 'شخصي',
};

const categoryColors: Record<string, string> = {
    work: 'bg-orange-500',
    study: 'bg-blue-500',
    health: 'bg-emerald-500',
    personal: 'bg-purple-500',
};


type ActiveTab = 'quests' | 'motivation';

export default function ThroneRoomPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state) => state.auth);
    const { profile, stats } = useAppSelector((state) => state.profile);

    const [activeTab, setActiveTab] = useState<ActiveTab>('quests');
    const [isLocked, setIsLocked] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);

    // المهام المقترحة
    const [quests, setQuests] = useState<RoyalQuest[]>(() => {
        // تحميل المهام المحفوظة من localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('suggested_quests');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return [];
                }
            }
        }
        return [];
    });
    const [questsLoading, setQuestsLoading] = useState(false);
    const [acceptingQuest, setAcceptingQuest] = useState<string | null>(null);

    // رسائل التحفيز
    const [motivation, setMotivation] = useState<MotivationMessage | null>(null);
    const [motivationLoading, setMotivationLoading] = useState(false);


    useEffect(() => {
        const init = async () => {
            const sessionResult = await dispatch(checkSession());

            if (!sessionResult.payload) {
                router.push('/auth/login');
                return;
            }

            const userId = (sessionResult.payload as any).id;
            await dispatch(fetchProfile(userId));
            const statsResult = await dispatch(fetchStats(userId));

            const currentStats = (statsResult.payload as any);
            if (currentStats?.canUnlockThroneRoom) {
                setIsLocked(false);
            }
            setInitialLoading(false);
        };

        init();
    }, [dispatch, router]);

    // جلب المهام الملكية
    const fetchRoyalQuests = useCallback(async () => {
        if (!user || !profile) return;

        setQuestsLoading(true);
        try {
            const response = await fetch('/api/royal-quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    personality: profile.ai_personality,
                }),
            });

            const data = await response.json();
            if (data.quests) {
                setQuests(data.quests);
                // حفظ في localStorage
                localStorage.setItem('suggested_quests', JSON.stringify(data.quests));
            }
        } catch (error) {
            console.error('Error fetching quests:', error);
        } finally {
            setQuestsLoading(false);
        }
    }, [user, profile]);

    // جلب رسالة التحفيز
    const fetchMotivation = useCallback(async () => {
        if (!user || !profile) return;

        setMotivationLoading(true);
        try {
            const response = await fetch('/api/king-motivation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    personality: profile.ai_personality,
                }),
            });

            const data = await response.json();
            if (data.motivation) {
                setMotivation(data.motivation);
            }
        } catch (error) {
            console.error('Error fetching motivation:', error);
        } finally {
            setMotivationLoading(false);
        }
    }, [user, profile]);


    // قبول مهمة ملكية
    const acceptQuest = async (quest: RoyalQuest) => {
        if (!user) return;

        setAcceptingQuest(quest.title);
        try {
            await dispatch(createTask({
                user_id: user.id,
                title: quest.title,
                description: quest.description,
                category: quest.category,
                task_type: quest.taskType,
                difficulty_factor: quest.difficulty,
                status: 'pending',
                start_time: null,
                end_time: null,
            }));

            // إزالة المهمة من القائمة وتحديث localStorage
            const updatedQuests = quests.filter(q => q.title !== quest.title);
            setQuests(updatedQuests);
            localStorage.setItem('suggested_quests', JSON.stringify(updatedQuests));
        } catch (error) {
            console.error('Error accepting quest:', error);
        } finally {
            setAcceptingQuest(null);
        }
    };

    // لا نحمّل البيانات تلقائياً - المستخدم يضغط على "تحديث" بنفسه

    // شاشة التحميل
    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <StarIcon className="w-8 h-8 text-amber-400 animate-pulse" />
                    </div>
                    <p className="text-xl text-slate-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    // شاشة القفل
    if (isLocked) {
        const remainingTasks = REQUIRED_TASKS - (stats?.totalCompletedTasks || 0);
        const progress = Math.min(100, ((stats?.totalCompletedTasks || 0) / REQUIRED_TASKS) * 100);

        return (
            <div className="min-h-screen bg-slate-900">
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 border-2 border-slate-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
                            <LockClosedIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                            قاعة العرش مغلقة
                        </h1>

                        <p className="text-slate-400 text-base sm:text-lg mb-6 sm:mb-8">
                            أكمل <span className="text-amber-400 font-bold">{REQUIRED_TASKS} مهام</span> لفتح قاعة العرش
                        </p>

                        <div className="bg-slate-800 border border-slate-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
                            <div className="flex justify-between text-sm mb-3">
                                <span className="text-slate-400">التقدم</span>
                                <span className="text-amber-400 font-medium">
                                    {stats?.totalCompletedTasks || 0} / {REQUIRED_TASKS}
                                </span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-4 mb-4">
                                <div
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full h-4 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-slate-500 text-sm">
                                {remainingTasks > 0
                                    ? `متبقي ${remainingTasks} مهمة لفتح القاعة`
                                    : 'أنت جاهز! جرب تحديث الصفحة'
                                }
                            </p>
                        </div>

                        <Link
                            href="/battlefield"
                            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg shadow-amber-500/20 text-sm sm:text-base"
                        >
                            <RocketIcon className="w-5 h-5" />
                            اذهب لإكمال المهام
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // الواجهة الرئيسية
    return (
        <div className="min-h-screen bg-slate-900">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* هيدر الملك - Responsive */}
                {/* يمين: صورة + عنوان ووصف | يسار: التبويبات */}
                <div className="flex flex-col md:flex-row md:justify-between items-center gap-4 mb-6 sm:mb-8" dir="rtl">
                    {/* يمين - صورة الملك + العنوان والوصف */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-lg flex-shrink-0">
                            <img 
                                src="/king-avatar.svg" 
                                alt="الملك" 
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-right">
                            <h1 className="text-xl sm:text-2xl font-bold text-white">
                                ملك العراق منتظر أحمد
                            </h1>
                            <p className="text-slate-400 text-sm">
                                مرحباً بك في قاعة العرش الملكية
                            </p>
                        </div>
                    </div>

                    {/* يسار - التبويبات */}
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => setActiveTab('quests')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap text-sm ${
                                activeTab === 'quests'
                                    ? 'bg-slate-700 text-white border border-slate-600'
                                    : 'bg-transparent text-slate-400 hover:text-white'
                            }`}
                        >
                            <TargetIcon className="w-4 h-4" />
                            المهام الملكية
                        </button>
                        <button
                            onClick={() => setActiveTab('motivation')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap text-sm ${
                                activeTab === 'motivation'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-transparent text-slate-400 hover:text-white'
                            }`}
                        >
                            <SpeakerLoudIcon className="w-4 h-4" />
                            رسالة الملك
                        </button>
                    </div>
                </div>

                {/* محتوى التبويبات */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6">
                    {/* المهام الملكية */}
                    {activeTab === 'quests' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <TargetIcon className="w-5 h-5 text-amber-400" />
                                    مهام مقترحة
                                </h2>
                                <button
                                    onClick={fetchRoyalQuests}
                                    disabled={questsLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all disabled:opacity-50 font-medium"
                                >
                                    <ReloadIcon className={`w-4 h-4 ${questsLoading ? 'animate-spin' : ''}`} />
                                    اقتراح مهام
                                </button>
                            </div>

                            {questsLoading ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                        <ReloadIcon className="w-6 h-6 text-amber-400 animate-spin" />
                                    </div>
                                    <p className="text-slate-400">جاري تحليل مهامك السابقة...</p>
                                </div>
                            ) : quests.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <TargetIcon className="w-8 h-8 text-slate-500" />
                                    </div>
                                    <p className="text-slate-400 mb-2">اضغط على "اقتراح مهام" لتحصل على مهام مقترحة</p>
                                    <p className="text-slate-500 text-sm mb-4">بناءً على مهامك السابقة في الأرشيف</p>
                                    <button
                                        onClick={fetchRoyalQuests}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold"
                                    >
                                        اقتراح مهام
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {quests.map((quest, index) => (
                                        <div
                                            key={index}
                                            className="bg-slate-900 border border-slate-700 rounded-xl p-4 sm:p-5 hover:border-amber-500/50 transition-all"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-3 h-3 rounded-full ${categoryColors[quest.category]} mt-2 flex-shrink-0`} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <h3 className="font-bold text-lg text-white">{quest.title}</h3>
                                                        {quest.taskType === 'main' && (
                                                            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md font-medium">
                                                                رئيسية
                                                            </span>
                                                        )}
                                                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                                                            {categoryLabels[quest.category]}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 text-sm mb-3">{quest.description}</p>
                                                    
                                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                                            <LightningBoltIcon className="w-4 h-4" />
                                                            صعوبة: {quest.difficulty}/5
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    const updatedQuests = quests.filter((_, i) => i !== index);
                                                                    setQuests(updatedQuests);
                                                                    localStorage.setItem('suggested_quests', JSON.stringify(updatedQuests));
                                                                }}
                                                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all text-sm flex items-center gap-1"
                                                            >
                                                                <Cross2Icon className="w-4 h-4" />
                                                                إلغاء
                                                            </button>
                                                            <button
                                                                onClick={() => acceptQuest(quest)}
                                                                disabled={acceptingQuest === quest.title}
                                                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                                                            >
                                                                {acceptingQuest === quest.title ? (
                                                                    <ReloadIcon className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircledIcon className="w-4 h-4" />
                                                                )}
                                                                قبول
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* رسالة التحفيز */}
                    {activeTab === 'motivation' && (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <SpeakerLoudIcon className="w-5 h-5 text-amber-400" />
                                    رسالة من الملك
                                </h2>
                                <button
                                    onClick={fetchMotivation}
                                    disabled={motivationLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all disabled:opacity-50"
                                >
                                    <ReloadIcon className={`w-4 h-4 ${motivationLoading ? 'animate-spin' : ''}`} />
                                    رسالة جديدة
                                </button>
                            </div>

                            {motivationLoading ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ReloadIcon className="w-8 h-8 text-amber-400 animate-spin" />
                                    </div>
                                    <p className="text-slate-400">الملك يحضر رسالة لك...</p>
                                </div>
                            ) : motivation ? (
                                <div className="text-center py-8">
                                    <div className="w-24 h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                                        <StarIcon className="w-12 h-12 text-amber-400" />
                                    </div>
                                    <div className="max-w-2xl mx-auto">
                                        <p className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-relaxed">
                                            "{motivation.message}"
                                        </p>
                                        <div className="flex items-center justify-center gap-2 text-slate-400">
                                            <span className="text-sm">— الملك</span>
                                            {motivation.basedOnPerformance && (
                                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">
                                                    مخصصة لك
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <p className="text-slate-400">اضغط على "رسالة جديدة" للحصول على رسالة من الملك</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>

            </main>
        </div>
    );
}
