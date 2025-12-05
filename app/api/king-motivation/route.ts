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

        // جلب الإحصائيات
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const { count: todayCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('end_time', todayStart.toISOString());

        const { count: pendingCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .neq('status', 'completed');

        const { data: profile } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single();

        // جلب آخر مهمة مكتملة
        const { data: lastTask } = await supabase
            .from('tasks')
            .select('title')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('end_time', { ascending: false })
            .limit(1)
            .single();

        const king = new KingAgent(personality || 'ملهمة');

        const motivation = await king.generateMotivation({
            totalXP: profile?.total_xp || 0,
            completedTasksToday: todayCount || 0,
            pendingTasks: pendingCount || 0,
            lastCompletedTask: lastTask?.title,
        });

        return NextResponse.json({ motivation });
    } catch (error: any) {
        console.error('Error generating motivation:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to generate motivation' },
            { status: 500 }
        );
    }
}
