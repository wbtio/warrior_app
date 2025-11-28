'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { signIn } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store';
import {
    RocketIcon,
    EnvelopeClosedIcon,
    LockClosedIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon,
} from '@radix-ui/react-icons';

export default function LoginPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await dispatch(signIn({ email, password }));

        if (signIn.fulfilled.match(result)) {
            router.push('/battlefield');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div className="w-full max-w-md">
                {/* العنوان */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                        <RocketIcon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">تسجيل الدخول</h2>
                    <p className="text-slate-400">عد إلى ساحة المعركة</p>
                </div>

                {/* النموذج */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                            البريد الإلكتروني
                        </label>
                        <div className="relative">
                            <EnvelopeClosedIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="warrior@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                            كلمة المرور
                        </label>
                        <div className="relative">
                            <LockClosedIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                    >
                        {loading ? 'جاري تسجيل الدخول...' : (
                            <>
                                <span>دخول</span>
                                <ArrowRightIcon className="w-5 h-5 rotate-180" />
                            </>
                        )}
                    </button>
                </form>

                {/* رابط إنشاء حساب */}
                <p className="mt-8 text-center text-slate-400">
                    ليس لديك حساب؟{' '}
                    <Link href="/auth/signup" className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">
                        إنشاء حساب جديد
                    </Link>
                </p>

                {/* رابط العودة */}
                <div className="mt-6 text-center">
                    <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        ← العودة للرئيسية
                    </Link>
                </div>
            </div>
        </div>
    );
}
