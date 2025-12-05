import { NextRequest, NextResponse } from 'next/server';
import { KingAgent } from '@/lib/ai/kingAgent';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, userId, personality, context } = body;

        // التحقق من وجود مفتاح API
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not set');
            return NextResponse.json(
                { error: 'AI service not configured' },
                { status: 500 }
            );
        }

        // إنشاء نسخة من الملك بشخصية المستخدم المحددة
        const king = new KingAgent(personality || 'ملهمة');

        // الحصول على الرد
        const response = await king.chat(message, context);

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('Error in king-chat API:', error);
        console.error('Error details:', error?.message, error?.stack);
        return NextResponse.json(
            { error: error?.message || 'Failed to get response from King' },
            { status: 500 }
        );
    }
}
