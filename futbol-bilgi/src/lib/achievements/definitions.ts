export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'starter' | 'mastery' | 'social' | 'streak' | 'duel' | 'speed';

export interface AchievementDefinition {
  key: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  rewardCoins: number;
  rewardGems: number;
  rewardXp: number;
  target: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    key: 'ilk_adim',
    name: 'İlk Adım',
    description: 'İlk sorunu cevapla.',
    category: 'starter',
    tier: 'bronze',
    rewardCoins: 50,
    rewardGems: 0,
    rewardXp: 10,
    target: 1,
  },
  {
    key: 'mukemmel_10',
    name: 'Müthiş 10',
    description: 'Toplam 10 doğru cevap ver.',
    category: 'mastery',
    tier: 'silver',
    rewardCoins: 200,
    rewardGems: 0,
    rewardXp: 30,
    target: 10,
  },
  {
    key: 'bilgi_krali',
    name: 'Bilgi Kralı',
    description: 'Toplam 100 doğru cevaba ulaş.',
    category: 'mastery',
    tier: 'gold',
    rewardCoins: 500,
    rewardGems: 0,
    rewardXp: 100,
    target: 100,
  },
  {
    key: 'streak_ustasi',
    name: 'Streak Ustası',
    description: '7 günlük giriş serisi yakala.',
    category: 'streak',
    tier: 'gold',
    rewardCoins: 300,
    rewardGems: 5,
    rewardXp: 75,
    target: 7,
  },
  {
    key: 'duello_sampiyonu',
    name: 'Düello Şampiyonu',
    description: '5 düello kazan.',
    category: 'duel',
    tier: 'gold',
    rewardCoins: 500,
    rewardGems: 0,
    rewardXp: 100,
    target: 5,
  },
  {
    key: 'hiz_seytani',
    name: 'Hız Şeytanı',
    description: '5 hızlı doğru cevap ver.',
    category: 'speed',
    tier: 'silver',
    rewardCoins: 200,
    rewardGems: 0,
    rewardXp: 40,
    target: 5,
  },
  {
    key: 'sosyal_kelebek',
    name: 'Sosyal Kelebek',
    description: '3 arkadaş ekle.',
    category: 'social',
    tier: 'silver',
    rewardCoins: 150,
    rewardGems: 0,
    rewardXp: 30,
    target: 3,
  },
  {
    key: 'milyoner',
    name: 'Milyoner',
    description: 'Milyoner modunda 1.000.000 puana ulaş.',
    category: 'mastery',
    tier: 'platinum',
    rewardCoins: 1000,
    rewardGems: 10,
    rewardXp: 250,
    target: 1000000,
  },
];
