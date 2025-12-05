'use client';

import { useState, useEffect } from 'react';
import { ClockIcon, Cross2Icon } from '@radix-ui/react-icons';

interface SmartTimePickerProps {
    value: number | null; // بالدقائق
    onChange: (minutes: number | null) => void;
    className?: string;
}

// اختصارات سريعة للوقت
const QUICK_TIMES = [
    { label: '15 د', minutes: 15 },
    { label: '30 د', minutes: 30 },
    { label: '45 د', minutes: 45 },
    { label: '1 س', minutes: 60 },
    { label: '1.5 س', minutes: 90 },
    { label: '2 س', minutes: 120 },
    { label: '3 س', minutes: 180 },
    { label: '4 س', minutes: 240 },
];

export function SmartTimePicker({ value, onChange, className = '' }: SmartTimePickerProps) {
    const [hours, setHours] = useState<string>('');
    const [minutes, setMinutes] = useState<string>('');
    const [noTimeLimit, setNoTimeLimit] = useState(value === null);

    // تحويل القيمة إلى ساعات ودقائق
    useEffect(() => {
        if (value !== null) {
            const h = Math.floor(value / 60);
            const m = value % 60;
            setHours(h > 0 ? h.toString() : '');
            setMinutes(m > 0 ? m.toString() : '');
            setNoTimeLimit(false);
        } else {
            setHours('');
            setMinutes('');
            setNoTimeLimit(true);
        }
    }, [value]);

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || /^\d{0,2}$/.test(val)) {
            setHours(val);
            updateValue(val, minutes);
        }
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || (/^\d{0,2}$/.test(val) && Number(val) < 60)) {
            setMinutes(val);
            updateValue(hours, val);
        }
    };

    const updateValue = (h: string, m: string) => {
        const totalHours = h === '' ? 0 : Number(h);
        const totalMinutes = m === '' ? 0 : Number(m);
        const total = totalHours * 60 + totalMinutes;

        if (total > 0) {
            onChange(total);
            setNoTimeLimit(false);
        } else if (h === '' && m === '') {
            // لا تغير شيء إذا كانت الحقول فارغة
        }
    };

    const handleQuickTime = (mins: number) => {
        onChange(mins);
        setNoTimeLimit(false);
    };

    const handleNoTimeLimit = () => {
        setNoTimeLimit(true);
        setHours('');
        setMinutes('');
        onChange(null);
    };

    const formatDisplayTime = () => {
        if (value === null) return 'بدون وقت محدد';
        const h = Math.floor(value / 60);
        const m = value % 60;
        if (h > 0 && m > 0) return `${h} ساعة و ${m} دقيقة`;
        if (h > 0) return `${h} ساعة`;
        return `${m} دقيقة`;
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* عرض الوقت المحدد */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
                <ClockIcon className="w-3 h-3" />
                <span>{formatDisplayTime()}</span>
            </div>

            {/* حقول الإدخال المباشر - مدمجة */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-600 rounded-lg p-2">
                <input
                    type="text"
                    inputMode="numeric"
                    value={hours}
                    onChange={handleHoursChange}
                    disabled={noTimeLimit}
                    placeholder="0"
                    className="w-12 px-2 py-1 bg-transparent text-white text-center text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-slate-500 text-xs">س</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={minutes}
                    onChange={handleMinutesChange}
                    disabled={noTimeLimit}
                    placeholder="0"
                    className="w-12 px-2 py-1 bg-transparent text-white text-center text-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-slate-500 text-xs">د</span>
            </div>

            {/* اختصارات سريعة - عرض مختصر */}
            <div className="flex flex-wrap gap-1.5">
                {QUICK_TIMES.slice(0, 6).map((time) => (
                    <button
                        key={time.minutes}
                        type="button"
                        onClick={() => handleQuickTime(time.minutes)}
                        className={`px-2 py-1 text-xs rounded-lg border transition-all ${value === time.minutes
                            ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                            : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {time.label}
                    </button>
                ))}
            </div>

            {/* خيار بدون وقت محدد */}
            <button
                type="button"
                onClick={handleNoTimeLimit}
                className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border transition-all w-full text-xs ${noTimeLimit
                    ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                    }`}
            >
                <Cross2Icon className="w-3 h-3" />
                بدون وقت
            </button>
        </div>
    );
}
