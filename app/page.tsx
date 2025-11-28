'use client';

import Link from 'next/link';
import {
  RocketIcon,
  PersonIcon,
  StarIcon,
  LightningBoltIcon,
  ArrowRightIcon,
} from '@radix-ui/react-icons';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="text-center">
          {/* الشعار */}
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl mb-6 sm:mb-8 shadow-lg shadow-amber-500/30">
            <RocketIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-4">
            المحارب
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-2">Warrior App</p>

          {/* الوصف */}
          <p className="text-base sm:text-lg text-slate-300 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
            نظام إنتاجية gamified يحول مهامك اليومية إلى معارك تكسب منها XP وترتقي في الرتب
          </p>

          {/* الأزرار */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/battlefield"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold text-base sm:text-lg shadow-lg shadow-amber-500/30"
            >
              <span>ابدأ المعركة</span>
              <ArrowRightIcon className="w-5 h-5 rotate-180" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-slate-700/50 text-white border border-slate-600 rounded-xl hover:bg-slate-700 transition-all font-semibold text-base sm:text-lg"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>

        {/* المميزات */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-6 text-center hover:border-amber-500/50 transition-colors">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-xl mb-4">
              <RocketIcon className="w-7 h-7 text-amber-400" />
            </div>
            <h4 className="font-bold text-lg text-white mb-2">ساحة المعركة</h4>
            <p className="text-slate-400">أنجز المهام واكسب XP</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-6 text-center hover:border-amber-500/50 transition-colors">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-xl mb-4">
              <StarIcon className="w-7 h-7 text-amber-400" />
            </div>
            <h4 className="font-bold text-lg text-white mb-2">قاعة العرش</h4>
            <p className="text-slate-400">استشر الملك (AI) واحصل على توجيهات</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 sm:p-6 text-center hover:border-amber-500/50 transition-colors">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-500/20 rounded-xl mb-4">
              <PersonIcon className="w-7 h-7 text-amber-400" />
            </div>
            <h4 className="font-bold text-lg text-white mb-2">ملف المحارب</h4>
            <p className="text-slate-400">تتبع تقدمك وإحصائياتك</p>
          </div>
        </div>
      </main>
    </div>
  );
}

