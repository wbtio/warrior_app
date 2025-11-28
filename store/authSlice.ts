import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
    needsVerification: boolean;
    emailToVerify: string | null;
}

const initialState: AuthState = {
    user: null,
    session: null,
    loading: false,
    error: null,
    needsVerification: false,
    emailToVerify: null,
};

// تسجيل الدخول
export const signIn = createAsyncThunk(
    'auth/signIn',
    async ({ email, password }: { email: string; password: string }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data.user;
    }
);

// إنشاء حساب جديد
export const signUp = createAsyncThunk(
    'auth/signUp',
    async ({ email, password, name }: { email: string; password: string; name: string }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name },
            },
        });

        if (error) throw error;

        // إنشاء ملف شخصي للمحارب إذا تم إنشاء المستخدم بنجاح
        if (data.user && data.user.identities && data.user.identities.length > 0) {
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    name,
                    total_xp: 0,
                    rank: 'محارب مبتدئ',
                });

            if (profileError) {
                // إذا فشل إنشاء الملف الشخصي، لا نوقف العملية ولكن نسجل الخطأ
                console.error('Error creating profile:', profileError);
            }
        }

        return { user: data.user, email };
    }
);

// التحقق من رمز OTP
export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({ email, token }: { email: string; token: string }, { rejectWithValue }) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup',
        });

        if (error) return rejectWithValue(error.message);
        return data.user;
    }
);

// تسجيل الخروج
export const signOut = createAsyncThunk('auth/signOut', async (_, { dispatch }) => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // مسح localStorage عند تسجيل الخروج
    if (typeof window !== 'undefined') {
        localStorage.removeItem('persist:warrior-app');
    }
});

// التحقق من الجلسة الحالية
export const checkSession = createAsyncThunk('auth/checkSession', async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.user || null;
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User | null>) => {
            state.user = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        resetVerification: (state) => {
            state.needsVerification = false;
            state.emailToVerify = null;
        }
    },
    extraReducers: (builder) => {
        // تسجيل الدخول
        builder.addCase(signIn.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(signIn.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        });
        builder.addCase(signIn.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'خطأ في تسجيل الدخول';
        });

        // إنشاء حساب
        builder.addCase(signUp.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(signUp.fulfilled, (state, action) => {
            state.loading = false;
            // إذا لم يكن هناك مستخدم (بانتظار التحقق)، نفعّل وضع التحقق
            if (action.payload.user && !action.payload.user.confirmed_at) {
                state.needsVerification = true;
                state.emailToVerify = action.payload.email;
            } else {
                state.user = action.payload.user;
            }
        });
        builder.addCase(signUp.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'خطأ في إنشاء الحساب';
        });

        // التحقق من OTP
        builder.addCase(verifyOtp.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(verifyOtp.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
            state.needsVerification = false;
            state.emailToVerify = null;
        });
        builder.addCase(verifyOtp.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string || 'رمز التحقق غير صحيح';
        });

        // تسجيل الخروج
        builder.addCase(signOut.fulfilled, (state) => {
            state.user = null;
            state.session = null;
            state.error = null;
            state.needsVerification = false;
            state.emailToVerify = null;
        });

        // التحقق من الجلسة
        builder.addCase(checkSession.fulfilled, (state, action) => {
            state.user = action.payload;
        });
    },
});

export const { setUser, clearError, resetVerification } = authSlice.actions;
export default authSlice.reducer;
