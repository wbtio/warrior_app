'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signUp, verifyOtp, clearError, resetVerification } from '@/store/authSlice';
import {
    RocketIcon,
    PersonIcon,
    EnvelopeClosedIcon,
    LockClosedIcon,
    ExclamationTriangleIcon,
    CheckCircledIcon,
} from '@radix-ui/react-icons';

export default function SignupPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { loading, error, user, needsVerification, emailToVerify } = useAppSelector((state) => state.auth);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(clearError());
        dispatch(resetVerification());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            router.push('/battlefield');
        }
    }, [user, router]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (password !== confirmPassword) {
            setValidationError('كلمات المرور غير متطابقة');
            return;
        }

        if (password.length < 6) {
            setValidationError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        await dispatch(signUp({ email, password, name }));
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setValidationError('الرمز يجب أن يتكون من 6 أرقام');
            return;
        }

        if (emailToVerify) {
            await dispatch(verifyOtp({ email: emailToVerify, token: otp }));
        }
    };

    // واجهة التحقق من الرمز
    if (needsVerification) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <EnvelopeClosedIcon className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        تحقق من بريدك
                    </h2>
                    <p className="text-slate-400 mb-8">
                        أرسلنا رمز تحقق مكون من 6 أرقام إلى <span className="text-amber-400">{emailToVerify}</span>
                    </p>

                    <form className="space-y-6" onSubmit={handleVerify}>
                        <div>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                required
                                className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-[0.5em] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                            />
                        </div>

                        {(error || validationError) && (
                            <div className="flex items-center justify-center gap-2 text-red-400 text-sm">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                {error || validationError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold disabled:opacity-50 shadow-lg shadow-amber-500/20"
                        >
                            {loading ? 'جاري التحقق...' : (
                                <>
                                    <CheckCircledIcon className="w-5 h-5" />
                                    تفعيل الحساب
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // واجهة التسجيل العادية
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                        <RocketIcon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        انضم للمحاربين
                    </h2>
                    <p className="text-slate-400">
                        أو{' '}
                        <Link href="/auth/login" className="text-amber-400 font-medium hover:text-amber-300 transition-colors">
                            سجل دخولك إذا كان لديك حساب
                        </Link>
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSignup}>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                            اسم المحارب
                        </label>
                        <div className="relative">
                            <PersonIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="اسمك هنا"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email-address" className="block text-sm font-medium text-slate-300 mb-2">
                            البريد الإلكتروني
                        </label>
                        <div className="relative">
                            <EnvelopeClosedIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="warrior@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-300 mb-2">
                            تأكيد كلمة المرور
                        </label>
                        <div className="relative">
                            <LockClosedIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="w-full pr-12 pl-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {(error || validationError) && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                            {error || validationError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3.5 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 mt-6"
                    >
                        {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                    </button>
                </form>

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
