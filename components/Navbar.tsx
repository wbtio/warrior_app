'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { signOut } from '@/store/authSlice';
import { clearProfile } from '@/store/profileSlice';
import {
    RocketIcon,
    PersonIcon,
    StarIcon,
    ArchiveIcon,
    LightningBoltIcon,
    ExitIcon,
} from '@radix-ui/react-icons';

export function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { profile } = useAppSelector((state) => state.profile);

    const handleLogout = async () => {
        dispatch(clearProfile());
        await dispatch(signOut());
        router.push('/auth/login');
    };

    const navItems = [
        { href: '/battlefield', label: 'ساحة المعركة', icon: RocketIcon },
        { href: '/profile', label: 'ملف المحارب', icon: PersonIcon },
        { href: '/throne-room', label: 'قاعة العرش', icon: StarIcon },
        { href: '/archive', label: 'الأرشيف', icon: ArchiveIcon },
    ];

    return (
        <nav className="bg-slate-900 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* اللوجو */}
                    <Link href="/battlefield" className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <RocketIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl text-white">المحارب</span>
                    </Link>

                    {/* القائمة */}
                    <div className="hidden md:flex items-center gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                                        ? 'bg-amber-500 text-white font-semibold'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* المنطقة اليمنى: XP + الخروج */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {profile && (
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-500/20 text-amber-400 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base">
                                <LightningBoltIcon className="w-4 h-4" />
                                <span>{profile.total_xp}</span>
                            </div>
                        )}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-2 sm:px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                            <ExitIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">خروج</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden border-t border-slate-800">
                <div className="flex justify-around py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${isActive
                                    ? 'text-amber-400'
                                    : 'text-slate-500'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="text-xs">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
