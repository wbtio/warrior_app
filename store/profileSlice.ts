import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';
import { getRankByXP } from '@/lib/utils/rankSystem';
import type { AIPersonality } from '@/lib/ai/kingAgent';

export interface Profile {
    id: string;
    name: string;
    avatar_url: string | null;
    rank: string;
    total_xp: number;
    ai_personality: AIPersonality;
    created_at: string;
    updated_at: string;
}

interface ProfileState {
    profile: Profile | null;
    stats: {
        completedTasksToday: number;
        completedTasksThisWeek: number;
        totalCompletedTasks: number;
        canUnlockThroneRoom: boolean;
    };
    loading: boolean;
    error: string | null;
}

const initialState: ProfileState = {
    profile: null,
    stats: {
        completedTasksToday: 0,
        completedTasksThisWeek: 0,
        totalCompletedTasks: 0,
        canUnlockThroneRoom: false,
    },
    loading: false,
    error: null,
};

// جلب الملف الشخصي
export const fetchProfile = createAsyncThunk(
    'profile/fetchProfile',
    async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // تحديث الرتبة بناءً على XP
        const currentRank = getRankByXP(data.total_xp);
        if (data.rank !== currentRank.name) {
            await supabase
                .from('profiles')
                .update({ rank: currentRank.name })
                .eq('id', userId);
            data.rank = currentRank.name;
        }

        return data as Profile;
    }
);

// جلب الإحصائيات
export const fetchStats = createAsyncThunk(
    'profile/fetchStats',
    async (userId: string) => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        // المهام المكتملة اليوم
        const { count: todayCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('end_time', todayStart.toISOString());

        // المهام المكتملة هذا الأسبوع
        const { count: weekCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('end_time', weekStart.toISOString());

        // إجمالي المهام المكتملة
        const { count: totalCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        return {
            completedTasksToday: todayCount || 0,
            completedTasksThisWeek: weekCount || 0,
            totalCompletedTasks: totalCount || 0,
            canUnlockThroneRoom: (totalCount || 0) >= 3, // يمكن فتح قاعة العرش بعد 3 مهام
        };
    }
);

// تحديث الملف الشخصي
export const updateProfile = createAsyncThunk(
    'profile/updateProfile',
    async ({ userId, updates }: { userId: string; updates: Partial<Profile> }) => {
        const { data, error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    }
);

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearProfile: (state) => {
            state.profile = null;
            state.stats = {
                completedTasksToday: 0,
                completedTasksThisWeek: 0,
                totalCompletedTasks: 0,
                canUnlockThroneRoom: false,
            };
        },
    },
    extraReducers: (builder) => {
        // جلب الملف الشخصي
        builder.addCase(fetchProfile.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.profile = action.payload;
        });
        builder.addCase(fetchProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'خطأ في جلب الملف الشخصي';
        });

        // جلب الإحصائيات
        builder.addCase(fetchStats.fulfilled, (state, action) => {
            state.stats = action.payload;
        });

        // تحديث الملف الشخصي
        builder.addCase(updateProfile.fulfilled, (state, action) => {
            state.profile = action.payload;
        });
    },
});

export const { clearError, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
