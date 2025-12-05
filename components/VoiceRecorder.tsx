'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type RecordingStatus = 'idle' | 'recording' | 'processing';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    disabled?: boolean;
    showStatusInside?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled = false, showStatusInside = false }: VoiceRecorderProps) {
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // تنظيف الموارد عند إلغاء التحميل
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // بدء التسجيل
    const startRecording = useCallback(async () => {
        try {
            setError(null);
            chunksRef.current = [];

            // طلب صلاحية الميكروفون
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            });

            streamRef.current = stream;

            // تحديد الصيغة المدعومة
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // إيقاف جميع المسارات
                stream.getTracks().forEach(track => track.stop());

                if (chunksRef.current.length === 0) {
                    setError('لم يتم تسجيل أي صوت');
                    setStatus('idle');
                    return;
                }

                // إنشاء Blob من القطع المسجلة
                const audioBlob = new Blob(chunksRef.current, { type: mimeType });

                // التحقق من حجم الملف (أقل من 100 بايت = فارغ تقريباً)
                if (audioBlob.size < 100) {
                    setError('التسجيل قصير جداً، حاول مرة أخرى');
                    setStatus('idle');
                    return;
                }

                // إرسال الصوت للتحويل
                await sendAudioForTranscription(audioBlob, mimeType);
            };

            // بدء التسجيل
            mediaRecorder.start(1000); // تسجيل كل ثانية
            setStatus('recording');
            setDuration(0);

            // بدء عداد الوقت
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Recording Error:', err);
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                setError('تم رفض صلاحية الميكروفون. يرجى السماح بالوصول للميكروفون.');
            } else if (err instanceof DOMException && err.name === 'NotFoundError') {
                setError('لم يتم العثور على ميكروفون. تأكد من توصيل ميكروفون.');
            } else {
                setError('حدث خطأ أثناء بدء التسجيل');
            }
            setStatus('idle');
        }
    }, []);

    // إيقاف التسجيل
    const stopRecording = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            setStatus('processing');
            mediaRecorderRef.current.stop();
        }
    }, []);

    // إرسال الصوت للتحويل
    const sendAudioForTranscription = async (audioBlob: Blob, mimeType: string) => {
        try {
            setStatus('processing');

            // تحديد امتداد الملف
            const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';
            const file = new File([audioBlob], `recording.${extension}`, { type: mimeType });

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'فشل في تحويل الصوت');
            }

            if (result.text && result.text.trim()) {
                onTranscription(result.text.trim());
            } else {
                setError('لم يتم التعرف على أي كلام. حاول التحدث بوضوح أكثر.');
            }

        } catch (err) {
            console.error('Transcription Error:', err);
            setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحويل الصوت');
        } finally {
            setStatus('idle');
            setDuration(0);
        }
    };

    // تنسيق الوقت
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // معالجة النقر على الزر
    const handleClick = () => {
        if (disabled) return;

        if (status === 'idle') {
            startRecording();
        } else if (status === 'recording') {
            stopRecording();
        }
    };

    // إذا كان showStatusInside = true، نرجع فقط الزر والحالة منفصلة
    if (showStatusInside) {
        return (
            <div className="flex flex-col items-center gap-1">
                <button
                    type="button"
                    onClick={handleClick}
                    disabled={disabled || status === 'processing'}
                    className={`
                        relative flex items-center justify-center w-10 h-10 rounded-full
                        transition-colors duration-300 focus:outline-none
                        border-2 shadow-lg
                        ${status === 'idle'
                            ? 'bg-slate-800 border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-400'
                            : status === 'recording'
                                ? 'bg-red-500 border-red-400 text-white'
                                : 'bg-slate-700 border-slate-500 text-slate-400 cursor-not-allowed'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title={
                        status === 'idle'
                            ? 'اضغط للتسجيل الصوتي'
                            : status === 'recording'
                                ? 'اضغط لإيقاف التسجيل'
                                : 'جاري المعالجة...'
                    }
                >
                    {status === 'processing' ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    )}

                    {status === 'recording' && (
                        <>
                            <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
                            <span className="absolute -inset-1 rounded-full bg-red-500/20 animate-pulse" />
                        </>
                    )}
                </button>

                {/* عرض الحالة أسفل الزر */}
                {(status === 'recording' || status === 'processing' || error) && (
                    <div className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                        status === 'recording' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        status === 'processing' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                        {status === 'recording' ? (
                            <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                {formatDuration(duration)}
                            </span>
                        ) : status === 'processing' ? 'جاري التحويل...' : error}
                    </div>
                )}
            </div>
        );
    }

    // العرض الافتراضي - الزر فقط بدون رسائل
    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled || status === 'processing'}
            className={`
                relative flex items-center justify-center w-10 h-10 rounded-full
                transition-colors duration-300 focus:outline-none
                border-2 shadow-lg
                ${status === 'idle'
                    ? 'bg-slate-800 border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-400'
                    : status === 'recording'
                        ? 'bg-red-500 border-red-400 text-white'
                        : 'bg-slate-700 border-slate-500 text-slate-400 cursor-not-allowed'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={
                status === 'idle'
                    ? 'اضغط للتسجيل الصوتي'
                    : status === 'recording'
                        ? 'اضغط لإيقاف التسجيل'
                        : 'جاري المعالجة...'
            }
        >
            {status === 'processing' ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
            )}

            {status === 'recording' && (
                <>
                    <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" />
                    <span className="absolute -inset-1 rounded-full bg-red-500/20 animate-pulse" />
                </>
            )}
        </button>
    );
}
