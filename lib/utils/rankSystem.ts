export type Rank =
    | 'محارب مبتدئ'
    | 'محارب صاعد'
    | 'فارس'
    | 'بطل'
    | 'قائد'
    | 'ملك الظلال';

interface RankInfo {
    name: Rank;
    minXP: number;
    maxXP: number;
    icon: string;
}

export const RANKS: RankInfo[] = [
    { name: 'محارب مبتدئ', minXP: 0, maxXP: 499, icon: '⚔️' },
    { name: 'محارب صاعد', minXP: 500, maxXP: 1499, icon: '🛡️' },
    { name: 'فارس', minXP: 1500, maxXP: 3499, icon: '🏇' },
    { name: 'بطل', minXP: 3500, maxXP: 6999, icon: '⭐' },
    { name: 'قائد', minXP: 7000, maxXP: 14999, icon: '👑' },
    { name: 'ملك الظلال', minXP: 15000, maxXP: Infinity, icon: '🌑' }
];

/**
 * الحصول على الرتبة بناءً على XP
 */
export function getRankByXP(xp: number): RankInfo {
    for (const rank of RANKS) {
        if (xp >= rank.minXP && xp <= rank.maxXP) {
            return rank;
        }
    }
    return RANKS[0]; // افتراضياً: محارب مبتدئ
}

/**
 * حساب التقدم نحو الرتبة التالية (نسبة مئوية)
 */
export function getProgressToNextRank(xp: number): {
    currentRank: RankInfo;
    nextRank: RankInfo | null;
    progress: number; // 0-100
    xpNeeded: number;
} {
    const currentRank = getRankByXP(xp);
    const currentIndex = RANKS.findIndex(r => r.name === currentRank.name);
    const nextRank = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;

    if (!nextRank) {
        return {
            currentRank,
            nextRank: null,
            progress: 100,
            xpNeeded: 0
        };
    }

    const xpInCurrentRank = xp - currentRank.minXP;
    const xpRangeForCurrentRank = currentRank.maxXP - currentRank.minXP + 1;
    const progress = Math.min(100, (xpInCurrentRank / xpRangeForCurrentRank) * 100);
    const xpNeeded = nextRank.minXP - xp;

    return {
        currentRank,
        nextRank,
        progress,
        xpNeeded: Math.max(0, xpNeeded)
    };
}

/**
 * الحصول على جميع الرتب
 */
export function getAllRanks(): RankInfo[] {
    return RANKS;
}
