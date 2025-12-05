import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export interface ParsedTask {
    title: string;
    description: string;
    estimatedMinutes: number | null; // null = بدون وقت محدد
    category: 'work' | 'study' | 'health' | 'personal' | string;
    suggestedNewCategory?: string; // إذا لم تتطابق مع الفئات الموجودة
    taskType: 'main' | 'side';
}

export interface TaskParserResult {
    success: boolean;
    data?: ParsedTask;
    error?: string;
}

const EXISTING_CATEGORIES = ['work', 'study', 'health', 'personal'];

const TASK_PARSER_PROMPT = `أنت مساعد ذكي متخصص في تحليل وصف المهام وتحويلها إلى بيانات منظمة.

المستخدم سيكتب وصفاً عشوائياً (قد يكون بالعامية أو غير مرتب) لمهمة يريد إنجازها.
مهمتك هي استخراج البيانات التالية:

1. **العنوان (title)**: صياغة عنوان مختصر وجذاب (5-10 كلمات كحد أقصى)
2. **الوصف (description)**: كتابة وصف كامل ومنظم يوضح تفاصيل المهمة
3. **الوقت المقدر (estimatedMinutes)**: استنتاج الوقت المناسب بالدقائق. إذا كانت المهمة مفتوحة أو غير محددة الوقت، ضع null
4. **الفئة (category)**: اختر من الفئات التالية: work (عمل), study (دراسة), health (صحة), personal (شخصي)
   - إذا لم تتطابق المهمة مع أي فئة، اختر الأقرب واقترح فئة جديدة في suggestedNewCategory
5. **نوع المهمة (taskType)**: main (رئيسية/مهمة) أو side (جانبية/بسيطة)

أجب بصيغة JSON فقط بدون أي نص إضافي:
{
  "title": "العنوان",
  "description": "الوصف",
  "estimatedMinutes": 60,
  "category": "work",
  "suggestedNewCategory": null,
  "taskType": "main"
}`;

export async function parseTaskWithAI(userInput: string): Promise<TaskParserResult> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: TASK_PARSER_PROMPT
        });

        const result = await model.generateContent(userInput);
        const response = result.response.text();

        // استخراج JSON من الإجابة
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                success: false,
                error: 'لم يتمكن الذكاء الاصطناعي من تحليل المهمة'
            };
        }

        const parsed = JSON.parse(jsonMatch[0]) as ParsedTask;

        // التحقق من صحة البيانات
        if (!parsed.title || parsed.title.trim() === '') {
            return {
                success: false,
                error: 'لم يتم استخراج عنوان صالح'
            };
        }

        // التأكد من أن الفئة صالحة
        if (!EXISTING_CATEGORIES.includes(parsed.category)) {
            parsed.suggestedNewCategory = parsed.category;
            parsed.category = 'personal'; // الفئة الافتراضية
        }

        // التأكد من نوع المهمة
        if (!['main', 'side'].includes(parsed.taskType)) {
            parsed.taskType = 'main';
        }

        return {
            success: true,
            data: parsed
        };
    } catch (error) {
        console.error('AI Task Parser Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'حدث خطأ أثناء تحليل المهمة'
        };
    }
}
