import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';
import { calculateXP } from '@/lib/utils/xpCalculator';

export interface Task {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    category: 'work' | 'study' | 'health' | 'personal';
    task_type: 'main' | 'side';
    difficulty_factor: number;
    start_time: string | null;
    end_time: string | null;
    xp: number;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    created_at: string;
    updated_at: string;
}

interface TasksState {
    tasks: Task[];
    loading: boolean;
    error: string | null;
}

const initialState: TasksState = {
    tasks: [],
    loading: false,
    error: null,
};

// جلب جميع المهام
export const fetchTasks = createAsyncThunk(
    'tasks/fetchTasks',
    async (userId: string) => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .neq('status', 'completed')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Task[];
    }
);

// إنشاء مهمة جديدة
export const createTask = createAsyncThunk(
    'tasks/createTask',
    async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'xp'>) => {
        // حساب XP المتوقع بناءً على الوقت المقدّر ومعامل الصعوبة
        let calculatedXP = 0;
        
        // إذا كان لدينا وقت البداية والنهاية، احسب XP الفعلي
        if (task.start_time && task.end_time) {
            calculatedXP = calculateXP(
                new Date(task.start_time),
                new Date(task.end_time),
                task.difficulty_factor
            );
        }

        const taskWithXP = {
            ...task,
            xp: calculatedXP
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert(taskWithXP)
            .select()
            .single();

        if (error) throw error;
        return data as Task;
    }
);

// تحديث مهمة
export const updateTask = createAsyncThunk(
    'tasks/updateTask',
    async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
        // جلب المهمة الحالية للحصول على البيانات الناقصة
        const { data: currentTask } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();

        if (!currentTask) throw new Error('المهمة غير موجودة');

        // إذا تم تحديث النهاية، احسب XP
        let finalUpdates = { ...updates };

        // حساب XP عند إكمال المهمة
        if (updates.status === 'completed' || (updates.end_time && updates.start_time)) {
            const startTime = updates.start_time || currentTask.start_time;
            const endTime = updates.end_time || new Date().toISOString();
            const difficultyFactor = updates.difficulty_factor || currentTask.difficulty_factor;

            if (startTime && endTime) {
                const xp = calculateXP(
                    new Date(startTime),
                    new Date(endTime),
                    difficultyFactor
                );
                finalUpdates.xp = xp;
            }
        }

        const { data, error } = await supabase
            .from('tasks')
            .update({ ...finalUpdates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // إذا أصبحت المهمة مكتملة، تحديث XP في الملف الشخصي
        if (updates.status === 'completed' && data.xp) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('total_xp')
                .eq('id', data.user_id)
                .single();

            if (profile) {
                await supabase
                    .from('profiles')
                    .update({ total_xp: (profile.total_xp || 0) + data.xp })
                    .eq('id', data.user_id);
            }
        }

        return data as Task;
    }
);

// حذف مهمة
export const deleteTask = createAsyncThunk(
    'tasks/deleteTask',
    async (id: string) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return id;
    }
);

const tasksSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // جلب المهام
        builder.addCase(fetchTasks.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchTasks.fulfilled, (state, action) => {
            state.loading = false;
            state.tasks = action.payload;
        });
        builder.addCase(fetchTasks.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'خطأ في جلب المهام';
        });

        // إنشاء مهمة
        builder.addCase(createTask.fulfilled, (state, action) => {
            state.tasks.unshift(action.payload);
        });

        // تحديث مهمة
        builder.addCase(updateTask.fulfilled, (state, action) => {
            const index = state.tasks.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
                // إزالة المهمة المكتملة من القائمة
                if (action.payload.status === 'completed') {
                    state.tasks.splice(index, 1);
                } else {
                    state.tasks[index] = action.payload;
                }
            }
        });

        // حذف مهمة
        builder.addCase(deleteTask.fulfilled, (state, action) => {
            state.tasks = state.tasks.filter(t => t.id !== action.payload);
        });
    },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
