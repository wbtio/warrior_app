import { NextRequest, NextResponse } from 'next/server';
import { KingAgent } from '@/lib/ai/kingAgent';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, userId, personality, context } = body;

        // إنشاء نسخة من الملك بشخصية المستخدم المحددة
        const king = new KingAgent(personality || 'ملهمة');

        // الحصول على الرد
        const response = await king.chat(message, context);

        return NextResponse.json({ response });
    } catch (error) {
        console.error('Error in king-chat API:', error);
        return NextResponse.json(
            { error: 'Failed to get response from King' },
            { status: 500 }
        );
    }
}
