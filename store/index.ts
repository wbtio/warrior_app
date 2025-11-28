import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './authSlice';
import tasksReducer from './tasksSlice';
import profileReducer from './profileSlice';

// إعدادات Redux Persist
const persistConfig = {
    key: 'warrior-app',
    version: 1,
    storage,
    whitelist: ['auth', 'profile'], // حفظ auth و profile فقط
};

// دمج جميع الـ reducers
const rootReducer = combineReducers({
    auth: authReducer,
    tasks: tasksReducer,
    profile: profileReducer,
});

// إنشاء persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
