'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/store/tasksSlice';
import { estimateXP } from '@/lib/utils/xpCalculator';
import { parseTaskWithAI, type ParsedTask } from '@/lib/ai/taskParser';
import { SmartTimePicker } from './SmartTimePicker';
import { CategoryManager, Category, DEFAULT_CATEGORIES, CATEGORY_COLORS } from './CategoryManager';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/Dialog';
import {
    Cross2Icon,
    RocketIcon,
    LightningBoltIcon,
    MagicWandIcon,
    Pencil2Icon,
    GearIcon,
    ReloadIcon,
    CheckCircledIcon,
    ExclamationTriangleIcon,
} from '@radix-ui/react-icons';
import { VoiceRecorder } from './VoiceRecorder';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'xp'>) => void;
    userId: string;
}

type InputMode = 'manual' | 'ai';
type AIStatus = 'idle' | 'loading' | 'success' | 'error';

export function AddTaskModal({ isOpen, onClose, onSubmit, userId }: AddTaskModalProps) {
    // الوضع الحالي
    const [inputMode, setInputMode] = useState<InputMode>('ai');

    // حالة الذكاء الاصطناعي
    const [aiInput, setAiInput] = useState('');
    const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
    const [aiError, setAiError] = useState('');
    const [aiParsedData, setAiParsedData] = useState<ParsedTask | null>(null);

    // حقول المهمة
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<string>('work');
    const [taskType, setTaskType] = useState<Task['task_type']>('main');
    const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(60);

    // إدارة الفئات
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);

    // حساب XP المتوقع
    const calculatedXP = estimatedMinutes ? estimateXP(estimatedMinutes, taskType) : 0;

    // معالجة النص بالذكاء الاصطناعي
    const handleAIProcess = async () => {
        if (!aiInput.trim()) return;

        setAiStatus('loading');
        setAiError('');

        const result = await parseTaskWithAI(aiInput);

        if (result.success && result.data) {
            setAiParsedData(result.data);
            setTitle(result.data.title);
            setDescription(result.data.description);
            setEstimatedMinutes(result.data.estimatedMinutes);
            setTaskType(result.data.taskType);

            // التعامل مع الفئة
            const existingCat = categories.find(
                (c) => c.name === result.data!.category || c.id === result.data!.category
            );
            if (existingCat) {
                setCategory(existingCat.id);
            } else {
                setCategory('personal');
            }

            // إذا اقترح فئة جديدة
            if (result.data.suggestedNewCategory) {
                setSuggestedCategory(result.data.suggestedNewCategory);
            } else {
                setSuggestedCategory(null);
            }

            setAiStatus('success');
        } else {
            setAiError(result.error || 'حدث خطأ غير متوقع');
            setAiStatus('error');
        }
    };

    // إضافة الفئة المقترحة
    const handleAddSuggestedCategory = () => {
        if (!suggestedCategory) return;

        const newId = `custom_${Date.now()}`;
        const newCategory: Category = {
            id: newId,
            name: suggestedCategory.toLowerCase().replace(/\s+/g, '_'),
            nameAr: suggestedCategory,
            color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
        };

        setCategories([...categories, newCategory]);
        setCategory(newId);
        setSuggestedCategory(null);
    };

    // إعادة تعيين النموذج
    const resetForm = () => {
        setInputMode('ai');
        setAiInput('');
        setAiStatus('idle');
        setAiError('');
        setAiParsedData(null);
        setTitle('');
        setDescription('');
        setCategory('work');
        setTaskType('main');
        setEstimatedMinutes(60);
        setSuggestedCategory(null);
    };

    // إرسال النموذج
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) return;

        // تحويل الفئة إلى النوع المطلوب
        const categoryValue = categories.find((c) => c.id === category)?.name || 'personal';

        onSubmit({
            user_id: userId,
            title: title.trim(),
            description: description.trim() || null,
            category: categoryValue as Task['category'],
            task_type: taskType,
            difficulty_factor: taskType === 'main' ? 4.0 : 2.0,
            start_time: null,
            end_time: null,
            status: 'pending',
        });

        resetForm();
        onClose();
    };

    // إعادة التعيين عند الإغلاق
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
                    {/* العنوان */}
                    <DialogHeader className="flex flex-row justify-between items-center mb-4">
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <RocketIcon className="w-6 h-6 text-amber-400" />
                            مهمة جديدة
                        </DialogTitle>
                        <DialogClose className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <Cross2Icon className="w-5 h-5" />
                        </DialogClose>
                    </DialogHeader>

                    {/* تبديل الوضع */}
                    <div className="flex gap-2 p-1 bg-slate-900 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => setInputMode('ai')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${inputMode === 'ai'
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <MagicWandIcon className="w-5 h-5" />
                            وضع الذكاء الاصطناعي
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMode('manual')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${inputMode === 'manual'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <Pencil2Icon className="w-5 h-5" />
                            الوضع اليدوي
                        </button>
                    </div>

                    {/* وضع الذكاء الاصطناعي */}
                    {inputMode === 'ai' && aiStatus !== 'success' && (
                        <div className="space-y-3 mb-4">
                            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-3xl p-4">
                                <p className="text-sm text-slate-300 mb-3 text-center">
                                    اكتب وصفاً للمهمة أو استخدم الميكروفون للتحدث
                                </p>
                                
                                {/* حقل النص مع زر الميكروفون المدمج */}
                                <div className="relative">
                                    <textarea
                                        value={aiInput}
                                        onChange={(e) => setAiInput(e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-3 pr-14 bg-slate-900 border-2 border-slate-600 rounded-3xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                        placeholder="مثال: بكرة لازم أخلص التقرير الشهري للمدير، المفروض ياخذ ساعتين تقريباً..."
                                        disabled={aiStatus === 'loading'}
                                    />
                                    
                                    {/* زر الميكروفون مندمج في الحقل - أسفل اليمين */}
                                    <div className="absolute bottom-3 right-3">
                                        <VoiceRecorder
                                            onTranscription={(text) => setAiInput(prev => prev ? `${prev} ${text}` : text)}
                                            disabled={aiStatus === 'loading'}
                                        />
                                    </div>
                                </div>

                                {/* رسالة الخطأ */}
                                {aiStatus === 'error' && (
                                    <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                                        <ExclamationTriangleIcon className="w-4 h-4" />
                                        {aiError}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleAIProcess}
                                    disabled={!aiInput.trim() || aiStatus === 'loading'}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {aiStatus === 'loading' ? (
                                        <>
                                            <ReloadIcon className="w-5 h-5 animate-spin" />
                                            جاري التحليل...
                                        </>
                                    ) : (
                                        <>
                                            <MagicWandIcon className="w-5 h-5" />
                                            تحليل بالذكاء الاصطناعي
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="text-center text-slate-500 text-sm">
                                أو{' '}
                                <button
                                    type="button"
                                    onClick={() => setInputMode('manual')}
                                    className="text-amber-400 hover:underline"
                                >
                                    أدخل البيانات يدوياً
                                </button>
                            </div>
                        </div>
                    )}

                    {/* نتيجة الذكاء الاصطناعي أو الوضع اليدوي */}
                    {(inputMode === 'manual' || aiStatus === 'success') && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* إشعار نجاح التحليل */}
                            {aiStatus === 'success' && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
                                    <CheckCircledIcon className="w-5 h-5" />
                                    تم تحليل المهمة بنجاح! يمكنك تعديل البيانات قبل الحفظ.
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAiStatus('idle');
                                            setAiParsedData(null);
                                        }}
                                        className="mr-auto text-slate-400 hover:text-white"
                                    >
                                        <ReloadIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* العنوان */}
                            <div>
                                <label className="block font-medium mb-2 text-slate-300">
                                    عنوان المهمة <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                    placeholder="مثال: إكمال تقرير المشروع"
                                />
                            </div>

                            {/* الوصف */}
                            <div>
                                <label className="block font-medium mb-2 text-slate-300">
                                    الوصف <span className="text-slate-500">(اختياري)</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                                    placeholder="أضف تفاصيل إضافية..."
                                />
                            </div>

                            {/* الفئة */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="font-medium text-slate-300">الفئة</label>
                                    <button
                                        type="button"
                                        onClick={() => setShowCategoryManager(true)}
                                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-amber-400 transition-colors"
                                    >
                                        <GearIcon className="w-4 h-4" />
                                        إدارة الفئات
                                    </button>
                                </div>

                                {/* اقتراح فئة جديدة */}
                                {suggestedCategory && (
                                    <div className="mb-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                        <p className="text-sm text-purple-300 mb-2">
                                            💡 اقترح الذكاء الاصطناعي فئة جديدة: <strong>{suggestedCategory}</strong>
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleAddSuggestedCategory}
                                            className="text-sm text-purple-400 hover:text-purple-300 underline"
                                        >
                                            إضافة هذه الفئة
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`flex items-center gap-3 px-4 py-3 border rounded-xl transition-all ${category === cat.id
                                                ? 'border-amber-500 bg-amber-500/10'
                                                : 'border-slate-600 hover:border-slate-500 bg-slate-900'
                                                }`}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="font-medium text-slate-200">{cat.nameAr}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* نوع المهمة */}
                            <div>
                                <label className="block font-medium mb-3 text-slate-300">نوع المهمة</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTaskType('main')}
                                        className={`flex-1 px-4 py-3 border rounded-xl font-medium transition-all ${taskType === 'main'
                                            ? 'border-amber-500 bg-amber-500 text-white'
                                            : 'border-slate-600 hover:border-slate-500 bg-slate-900 text-slate-300'
                                            }`}
                                    >
                                        <RocketIcon className="w-4 h-4 inline ml-2" />
                                        رئيسية (×4 XP)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTaskType('side')}
                                        className={`flex-1 px-4 py-3 border rounded-xl font-medium transition-all ${taskType === 'side'
                                            ? 'border-amber-500 bg-amber-500 text-white'
                                            : 'border-slate-600 hover:border-slate-500 bg-slate-900 text-slate-300'
                                            }`}
                                    >
                                        جانبية (×2 XP)
                                    </button>
                                </div>
                            </div>

                            {/* الوقت المقدّر */}
                            <div>
                                <label className="block font-medium mb-3 text-slate-300">الوقت المقدّر</label>
                                <SmartTimePicker
                                    value={estimatedMinutes}
                                    onChange={setEstimatedMinutes}
                                />
                            </div>

                            {/* عرض XP المتوقع */}
                            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-4 rounded-xl text-center">
                                <div className="text-sm mb-1 text-slate-300">XP المتوقع عند الإكمال:</div>
                                <div className="text-3xl font-bold text-amber-400 flex items-center justify-center gap-2">
                                    <LightningBoltIcon className="w-6 h-6" />
                                    {estimatedMinutes ? `${calculatedXP} XP` : '-- XP'}
                                </div>
                                {!estimatedMinutes && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        سيتم حساب XP بناءً على الوقت الفعلي للإنجاز
                                    </p>
                                )}
                            </div>

                            {/* أزرار */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors font-semibold text-slate-300"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={!title.trim()}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    إنشاء المهمة
                                </button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* نافذة إدارة الفئات */}
            <CategoryManager
                isOpen={showCategoryManager}
                onClose={() => setShowCategoryManager(false)}
                categories={categories}
                onCategoriesChange={setCategories}
            />
        </>
    );
}
