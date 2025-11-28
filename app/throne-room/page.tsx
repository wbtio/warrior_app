'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { checkSession } from '@/store/authSlice';
import { fetchProfile, fetchStats } from '@/store/profileSlice';
import { Navbar } from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import {
    StarIcon,
    LockClosedIcon,
    PaperPlaneIcon,
    PersonIcon,
    RocketIcon,
} from '@radix-ui/react-icons';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const REQUIRED_TASKS = 3; // عدد المهام المطلوبة لفتح قاعة العرش

export default function ThroneRoomPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { user } = useAppSelector((state) => state.auth);
    const { profile, stats } = useAppSelector((state) => state.profile);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
                loadMessages(userId);
            }
            setInitialLoading(false);
        };

        init();
    }, [dispatch, router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async (userId: string) => {
        const { data } = await supabase
            .from('ai_interactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(50);

        if (data) {
            setMessages(data.map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.message,
                timestamp: new Date(msg.created_at),
            })));
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !user || !profile) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            await supabase.from('ai_interactions').insert({
                user_id: user.id,
                message: input,
                role: 'user',
            });

            const response = await fetch('/api/king-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    userId: user.id,
                    personality: profile.ai_personality,
                    context: {
                        totalXP: profile.total_xp,
                        completedTasks: stats.totalCompletedTasks,
                        rank: profile.rank,
                    },
                }),
            });

            const data = await response.json();

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);

            await supabase.from('ai_interactions').insert({
                user_id: user.id,
                message: data.response,
                role: 'assistant',
            });

        } catch (error) {
            console.error('Error chatting with King:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'عذراً، حدث خطأ. حاول مرة أخرى لاحقاً.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

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

    // شاشة القفل - إذا لم يكمل المهام المطلوبة
    if (isLocked) {
        const remainingTasks = REQUIRED_TASKS - (stats?.totalCompletedTasks || 0);
        const progress = Math.min(100, ((stats?.totalCompletedTasks || 0) / REQUIRED_TASKS) * 100);

        return (
            <div className="min-h-screen bg-slate-900">
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
                    <div className="max-w-md w-full text-center">
                        {/* أيقونة القفل */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-800 border-2 border-slate-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
                            <LockClosedIcon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-500" />
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                            قاعة العرش مغلقة
                        </h1>

                        <p className="text-slate-400 text-base sm:text-lg mb-6 sm:mb-8">
                            أكمل <span className="text-amber-400 font-bold">{REQUIRED_TASKS} مهام</span> لفتح قاعة العرش والتحدث مع الملك
                        </p>

                        {/* شريط التقدم */}
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

                        {/* زر العودة */}
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

    // واجهة المحادثة - إذا كانت القاعة مفتوحة
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
                {/* رأس الصفحة */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3">
                        <StarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                        قاعة العرش
                    </h1>
                    <p className="text-slate-400">استشر الملك واحصل على توجيهات</p>
                    {profile && (
                        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300">
                            <PersonIcon className="w-4 h-4" />
                            الشخصية: {profile.ai_personality}
                        </div>
                    )}
                </div>

                {/* منطقة المحادثات */}
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl sm:rounded-2xl mb-3 sm:mb-4 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <StarIcon className="w-10 h-10 text-amber-400" />
                                </div>
                                <p className="text-xl font-bold text-white mb-2">مرحباً بك في قاعة العرش!</p>
                                <p className="text-slate-400">
                                    ابدأ محادثة مع الملك للحصول على توجيهات وإرشادات
                                </p>
                            </div>
                        )}

                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-xl sm:rounded-2xl ${message.role === 'user'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                        : 'bg-slate-700 text-white'
                                        }`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="font-bold mb-2 flex items-center gap-2 text-amber-400">
                                            <StarIcon className="w-4 h-4" />
                                            <span>الملك</span>
                                        </div>
                                    )}
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                    <p className="text-xs mt-2 opacity-60">
                                        {message.timestamp.toLocaleTimeString('ar-SA')}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-700 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span>الملك يفكر...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* منطقة الإدخال */}
                    <div className="border-t border-slate-700 p-3 sm:p-4">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                                placeholder="اكتب رسالتك للملك..."
                                disabled={loading}
                                className="flex-1 px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 text-sm sm:text-base"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm sm:text-base"
                            >
                                <PaperPlaneIcon className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                                <span className="hidden sm:inline">إرسال</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
