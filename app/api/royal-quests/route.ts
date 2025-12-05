import { NextRequest, NextResponse } from 'next/server';
import { KingAgent } from '@/lib/ai/kingAgent';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, personality } = body;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'AI service not configured' },
                { status: 500 }
            );
        }

        // جلب المهام المكتملة من الأرشيف بالتفصيل الكامل
        const { data: completedTasks } = await supabase
            .from('tasks')
            .select('title, description, category, task_type, xp, difficulty_factor')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('end_time', { ascending: false })
            .limit(30);

        // جلب الملف الشخصي
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single();

        // جلب عدد المهام المعلقة
        const { count: pendingCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .neq('status', 'completed');

        const king = new KingAgent(personality || 'ملهمة');

        const quests = await king.generateSuggestedTasks({
            completedTasks: completedTasks || [],
            totalXP: profile?.total_xp || 0,
            pendingTasksCount: pendingCount || 0,
        });

        return NextResponse.json({ quests });
    } catch (error: any) {
        console.error('Error generating suggested tasks:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to generate tasks' },
            { status: 500 }
        );
    }
}
