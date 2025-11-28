/**
 * حساب XP بناءً على مدة المهمة ومعامل الصعوبة
 * 
 * الصيغة: XP = (المدة بالدقائق × معامل الصعوبة)
 * 
 * معاملات الصعوبة الافتراضية:
 * - مهمة رئيسية: 4.0
 * - مهمة جانبية: 2.0
 */

export function calculateXP(
    startTime: Date,
    endTime: Date,
    difficultyFactor: number
): number {
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.max(1, Math.floor(durationMs / (1000 * 60)));

    return Math.round(durationMinutes * difficultyFactor);
}

/**
 * الحصول على معامل الصعوبة الافتراضي حسب نوع المهمة
 */
export function getDefaultDifficultyFactor(taskType: 'main' | 'side'): number {
    return taskType === 'main' ? 4.0 : 2.0;
}

/**
 * حساب XP المتوقع (للمعاينة عند إنشاء المهمة)
 */
export function estimateXP(
    durationMinutes: number,
    taskType: 'main' | 'side'
): number {
    const difficultyFactor = getDefaultDifficultyFactor(taskType);
    return Math.round(durationMinutes * difficultyFactor);
}

/**
 * تحويل XP إلى وقت تقريبي (للعرض)
 */
export function xpToTime(xp: number, taskType: 'main' | 'side'): number {
    const difficultyFactor = getDefaultDifficultyFactor(taskType);
    return Math.round(xp / difficultyFactor);
}
