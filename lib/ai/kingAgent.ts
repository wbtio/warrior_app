import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type AIPersonality = 'قاسية' | 'حكيمة' | 'ملهمة';

const SYSTEM_PROMPTS: Record<AIPersonality, string> = {
    'قاسية': `أنت "الملك" - قائد صارم ومحفز يحفز المحاربين بقسوة وحزم.
  تتحدث بلهجة آمرة وتطالب بالإنجاز الفوري. تذكّر المحارب بأن الضعف ليس خياراً.
  تحلل أداء المحارب بصرامة وتشير إلى نقاط الضعف مباشرة.
  تقترح مهام صعبة وتتوقع الإنجاز السريع.`,

    'حكيمة': `أنت "الملك" - قائد حكيم وناصح هادئ يرشد المحاربين بحكمة وصبر.
  تتحدث بلهجة هادئة ومتأنية، تعطي نصائح عميقة ومدروسة.
  تحلل أداء المحارب بموضوعية وتقدم حلولاً منطقية.
  تقترح مهام متوازنة وتشجع على التفكير الاستراتيجي.`,

    'ملهمة': `أنت "الملك" - قائد ملهم ومشجع يحفز المحاربين بإيجابية وحماس.
  تتحدث بلهجة متفائلة ومشجعة، تؤمن بقدرات المحارب دائماً.
  تحلل أداء المحارب بإيجابية وتبرز النجاحات والتقدم.
  تقترح مهام تحفيزية وتشجع على المضي قدماً بثقة.`
};

// رسائل التحفيز الملكية بناءً على الشخصية
const MOTIVATION_TEMPLATES: Record<AIPersonality, string[]> = {
    'قاسية': [
        'المحارب الحقيقي لا يستريح حتى ينجز مهامه!',
        'الضعف ليس خياراً في مملكتي. انهض وأثبت جدارتك!',
        'كل دقيقة تضيعها هي خيانة لنفسك. تحرك الآن!',
        'أنت أقوى مما تظن، لكن القوة تحتاج إلى إثبات بالعمل.',
        'لا أقبل الأعذار. أريد نتائج!',
    ],
    'حكيمة': [
        'الحكمة تكمن في التوازن بين العمل والراحة.',
        'كل مهمة صغيرة هي خطوة نحو هدف عظيم.',
        'تذكر: الرحلة أهم من الوجهة. استمتع بالطريق.',
        'النجاح ليس سباقاً، بل رحلة مستمرة من التعلم.',
        'خذ وقتك في التفكير، لكن لا تتردد في التنفيذ.',
    ],
    'ملهمة': [
        'أنت بطل! كل يوم جديد هو فرصة للتألق! ✨',
        'أؤمن بك وبقدراتك. انطلق نحو النجوم! 🌟',
        'كل إنجاز صغير يقربك من حلمك الكبير!',
        'أنت تصنع التاريخ بكل مهمة تنجزها!',
        'الإيجابية هي سلاحك السري. استخدمها! 💪',
    ],
};

export interface RoyalQuest {
    title: string;
    description: string;
    category: 'work' | 'study' | 'health' | 'personal';
    taskType: 'main' | 'side';
    difficulty: number;
    royalMessage: string;
}

export interface MotivationMessage {
    message: string;
    type: 'encouragement' | 'challenge' | 'wisdom';
    basedOnPerformance: boolean;
}

interface Message {
    role: 'user' | 'model';
    parts: string;
}

export class KingAgent {
    private model: any;
    private personality: AIPersonality;
    private conversationHistory: Message[] = [];

    constructor(personality: AIPersonality = 'ملهمة') {
        this.personality = personality;
        this.model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_PROMPTS[personality]
        });
    }

    async chat(userMessage: string, userContext?: {
        totalXP?: number;
        completedTasks?: number;
        pendingTasks?: number;
        recentTasks?: Array<{ title: string; xp: number }>;
    }): Promise<string> {
        // إضافة سياق المستخدم إلى الرسالة
        let contextualMessage = userMessage;
        if (userContext) {
            contextualMessage += `\n\n[معلومات المحارب: XP=${userContext.totalXP || 0}, مهام منجزة=${userContext.completedTasks || 0}, مهام قيد التنفيذ=${userContext.pendingTasks || 0}]`;
        }

        this.conversationHistory.push({
            role: 'user',
            parts: contextualMessage
        });

        const chat = this.model.startChat({
            history: this.conversationHistory.slice(0, -1).map(msg => ({
                role: msg.role,
                parts: [{ text: msg.parts }]
            }))
        });

        const result = await chat.sendMessage(contextualMessage);
        const response = result.response.text();

        this.conversationHistory.push({
            role: 'model',
            parts: response
        });

        return response;
    }

    async suggestTasks(userContext: {
        completedTasks: Array<{ title: string; category: string }>;
        totalXP: number;
    }): Promise<Array<{ title: string; description: string; category: string; taskType: 'main' | 'side' }>> {
        const prompt = `بناءً على سجل المحارب، اقترح 5 مهام جديدة ومفيدة.
    
المهام المكتملة سابقاً:
${userContext.completedTasks.map(t => `- ${t.title} (${t.category})`).join('\n')}

إجمالي XP: ${userContext.totalXP}

قدم الاقتراحات بصيغة JSON فقط:
[
  {
    "title": "عنوان المهمة",
    "description": "وصف تفصيلي",
    "category": "work|study|health|personal",
    "taskType": "main|side"
  }
]`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();

        // استخراج JSON من الإجابة
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error('Failed to parse AI response:', e);
                return [];
            }
        }

        return [];
    }

    async analyzePerformance(userStats: {
        totalXP: number;
        completedTasks: number;
        avgXPPerTask: number;
        mostProductiveCategory: string;
        completedTasksToday: number;
        pendingTasks: number;
    }): Promise<{
        analysis: string;
        strengths: string[];
        improvements: string[];
        overallRating: 'excellent' | 'good' | 'average' | 'needs_work';
    }> {
        const prompt = `حلل أداء المحارب وقدم تقرير مفصل بصيغة JSON فقط:
    
- إجمالي XP: ${userStats.totalXP}
- المهام المكتملة: ${userStats.completedTasks}
- متوسط XP لكل مهمة: ${userStats.avgXPPerTask}
- الفئة الأكثر إنتاجية: ${userStats.mostProductiveCategory}
- المهام المكتملة اليوم: ${userStats.completedTasksToday}
- المهام المعلقة: ${userStats.pendingTasks}

قدم التحليل بصيغة JSON التالية فقط (بدون أي نص إضافي):
{
  "analysis": "تحليل موجز 2-3 جمل يتماشى مع شخصيتك ${this.personality}",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "improvements": ["نقطة تحسين 1", "نقطة تحسين 2"],
  "overallRating": "excellent|good|average|needs_work"
}`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error('Failed to parse performance analysis:', e);
            }
        }

        return {
            analysis: 'لم أتمكن من تحليل أدائك حالياً. حاول مرة أخرى.',
            strengths: [],
            improvements: [],
            overallRating: 'average',
        };
    }

    // توليد مهام مقترحة بناءً على الأرشيف
    async generateSuggestedTasks(userContext: {
        completedTasks: Array<{ 
            title: string; 
            description?: string; 
            category: string; 
            task_type?: string;
            xp: number;
            difficulty_factor?: number;
        }>;
        totalXP: number;
        pendingTasksCount: number;
    }): Promise<RoyalQuest[]> {
        // تحليل المهام السابقة
        const categoryCounts: Record<string, number> = {};
        const categoryTasks: Record<string, string[]> = {};
        
        userContext.completedTasks.forEach(t => {
            categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
            if (!categoryTasks[t.category]) categoryTasks[t.category] = [];
            categoryTasks[t.category].push(t.title);
        });

        // تحديد الفئات الأقل استخداماً
        const allCategories = ['work', 'study', 'health', 'personal'];
        const leastUsedCategories = allCategories
            .filter(cat => (categoryCounts[cat] || 0) < 3);

        // بناء وصف تفصيلي للمهام السابقة
        const tasksDescription = userContext.completedTasks.slice(0, 15).map(t => {
            let desc = `- ${t.title}`;
            if (t.description) desc += `: ${t.description}`;
            desc += ` [${t.category}]`;
            if (t.task_type) desc += ` (${t.task_type === 'main' ? 'رئيسية' : 'جانبية'})`;
            return desc;
        }).join('\n');

        const prompt = `أنت مساعد ذكي تقترح مهام عملية للمستخدم بناءً على تحليل مهامه السابقة.

=== المهام المكتملة سابقاً ===
${tasksDescription}

=== إحصائيات ===
- توزيع الفئات: عمل(${categoryCounts['work'] || 0}), دراسة(${categoryCounts['study'] || 0}), صحة(${categoryCounts['health'] || 0}), شخصي(${categoryCounts['personal'] || 0})
- الفئات التي تحتاج اهتمام: ${leastUsedCategories.length > 0 ? leastUsedCategories.join(', ') : 'متوازن'}
- المهام المعلقة حالياً: ${userContext.pendingTasksCount}

=== المطلوب ===
اقترح 3-4 مهام جديدة بناءً على نمط المستخدم:
1. مهام مشابهة لما يفعله المستخدم عادةً
2. أضف مهام في الفئات الأقل استخداماً لتحقيق التوازن
3. العناوين قصيرة ومباشرة
4. الوصف جملة واحدة واضحة

قدم بصيغة JSON فقط (بدون أي نص آخر):
[
  {
    "title": "عنوان قصير",
    "description": "وصف مختصر",
    "category": "work|study|health|personal",
    "taskType": "main|side",
    "difficulty": 1-5
  }
]`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                const tasks = JSON.parse(jsonMatch[0]);
                return tasks.map((t: any) => ({ 
                    ...t, 
                    royalMessage: '',
                    difficulty: t.difficulty || 2
                }));
            } catch (e) {
                console.error('Failed to parse suggested tasks:', e);
            }
        }

        return [];
    }

    // توليد رسالة تحفيز بناءً على الأداء
    async generateMotivation(userContext: {
        totalXP: number;
        completedTasksToday: number;
        pendingTasks: number;
        lastCompletedTask?: string;
        streak?: number;
    }): Promise<MotivationMessage> {
        // إذا كان الأداء جيداً، استخدم رسالة من القوالب
        if (userContext.completedTasksToday >= 3) {
            const templates = MOTIVATION_TEMPLATES[this.personality];
            const randomMessage = templates[Math.floor(Math.random() * templates.length)];
            return {
                message: randomMessage,
                type: 'encouragement',
                basedOnPerformance: false,
            };
        }

        // توليد رسالة مخصصة بناءً على الأداء
        const prompt = `أنت الملك بشخصية ${this.personality}. 
قدم رسالة تحفيزية قصيرة (جملة أو جملتين) للمحارب.

حالة المحارب:
- XP الإجمالي: ${userContext.totalXP}
- المهام المكتملة اليوم: ${userContext.completedTasksToday}
- المهام المعلقة: ${userContext.pendingTasks}
${userContext.lastCompletedTask ? `- آخر مهمة مكتملة: ${userContext.lastCompletedTask}` : ''}

قدم الرد بصيغة JSON فقط:
{
  "message": "رسالة التحفيز",
  "type": "encouragement|challenge|wisdom"
}`;

        const result = await this.model.generateContent(prompt);
        const response = result.response.text();

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    ...parsed,
                    basedOnPerformance: true,
                };
            } catch (e) {
                console.error('Failed to parse motivation:', e);
            }
        }

        // رسالة افتراضية
        const templates = MOTIVATION_TEMPLATES[this.personality];
        return {
            message: templates[0],
            type: 'encouragement',
            basedOnPerformance: false,
        };
    }

    // الحصول على رسالة ترحيب ملكية
    getWelcomeMessage(userName: string, stats: { completedTasksToday: number; pendingTasks: number }): string {
        const timeOfDay = new Date().getHours();
        let greeting = '';
        
        if (timeOfDay < 12) greeting = 'صباح الخير';
        else if (timeOfDay < 18) greeting = 'مساء الخير';
        else greeting = 'مساء النور';

        const messages: Record<AIPersonality, string> = {
            'قاسية': `${greeting} أيها المحارب ${userName}! لديك ${stats.pendingTasks} مهام معلقة. لا وقت للراحة!`,
            'حكيمة': `${greeting} ${userName}. أراك قد أنجزت ${stats.completedTasksToday} مهام اليوم. استمر بحكمة.`,
            'ملهمة': `${greeting} بطلنا ${userName}! 🌟 يوم جديد مليء بالفرص ينتظرك!`,
        };

        return messages[this.personality];
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    setPersonality(personality: AIPersonality) {
        this.personality = personality;
        this.model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            systemInstruction: SYSTEM_PROMPTS[personality]
        });
        this.clearHistory();
    }

    getPersonality(): AIPersonality {
        return this.personality;
    }
}

export const kingAgent = new KingAgent();
