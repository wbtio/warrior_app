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
            model: 'gemini-1.5-flash',
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
    }): Promise<string> {
        const prompt = `حلل أداء المحارب وقدم تقرير تحفيزي:
    
- إجمالي XP: ${userStats.totalXP}
- المهام المكتملة: ${userStats.completedTasks}
- متوسط XP لكل مهمة: ${userStats.avgXPPerTask}
- الفئة الأكثر إنتاجية: ${userStats.mostProductiveCategory}

قدم تحليلاً موجزاً (3-4 جمل) يتماشى مع شخصيتك (${this.personality}).`;

        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    setPersonality(personality: AIPersonality) {
        this.personality = personality;
        this.model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: SYSTEM_PROMPTS[personality]
        });
        this.clearHistory();
    }
}

export const kingAgent = new KingAgent();
