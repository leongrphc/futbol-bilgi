import 'package:flutter/material.dart';

class AchievementDefinition {
  const AchievementDefinition({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.rarity,
    required this.coins,
    required this.gems,
    required this.xp,
    required this.target,
    required this.icon,
  });

  final String id;
  final String title;
  final String description;
  final String category;
  final String rarity;
  final int coins;
  final int gems;
  final int xp;
  final int target;
  final IconData icon;
}

const achievementDefinitions = [
  AchievementDefinition(
    id: 'ilk_adim',
    title: 'İlk Adım',
    description: 'İlk sorunu cevapla.',
    category: 'Starter',
    rarity: 'Bronze',
    coins: 50,
    gems: 0,
    xp: 10,
    target: 1,
    icon: Icons.flag_rounded,
  ),
  AchievementDefinition(
    id: 'mukemmel_10',
    title: 'Müthiş 10',
    description: 'Toplam 10 doğru cevap ver.',
    category: 'Mastery',
    rarity: 'Silver',
    coins: 200,
    gems: 0,
    xp: 30,
    target: 10,
    icon: Icons.check_circle_rounded,
  ),
  AchievementDefinition(
    id: 'bilgi_krali',
    title: 'Bilgi Kralı',
    description: 'Toplam 100 doğru cevaba ulaş.',
    category: 'Mastery',
    rarity: 'Gold',
    coins: 500,
    gems: 0,
    xp: 100,
    target: 100,
    icon: Icons.workspace_premium_rounded,
  ),
  AchievementDefinition(
    id: 'streak_ustasi',
    title: 'Streak Ustası',
    description: '7 günlük giriş serisi yakala.',
    category: 'Streak',
    rarity: 'Gold',
    coins: 300,
    gems: 5,
    xp: 75,
    target: 7,
    icon: Icons.local_fire_department_rounded,
  ),
  AchievementDefinition(
    id: 'duello_sampiyonu',
    title: 'Düello Şampiyonu',
    description: '5 düello kazan.',
    category: 'Duel',
    rarity: 'Gold',
    coins: 500,
    gems: 0,
    xp: 100,
    target: 5,
    icon: Icons.sports_martial_arts_rounded,
  ),
  AchievementDefinition(
    id: 'hiz_seytani',
    title: 'Hız Şeytanı',
    description: '5 hızlı doğru cevap ver.',
    category: 'Speed',
    rarity: 'Silver',
    coins: 200,
    gems: 0,
    xp: 40,
    target: 5,
    icon: Icons.bolt_rounded,
  ),
  AchievementDefinition(
    id: 'sosyal_kelebek',
    title: 'Sosyal Kelebek',
    description: '3 arkadaş ekle.',
    category: 'Social',
    rarity: 'Silver',
    coins: 150,
    gems: 0,
    xp: 30,
    target: 3,
    icon: Icons.group_rounded,
  ),
  AchievementDefinition(
    id: 'milyoner',
    title: 'Milyoner',
    description: 'Milyoner modunda 1.000.000 puana ulaş.',
    category: 'Mastery',
    rarity: 'Platinum',
    coins: 1000,
    gems: 10,
    xp: 250,
    target: 1000000,
    icon: Icons.emoji_events_rounded,
  ),
];

String achievementTitle(String id) {
  for (final definition in achievementDefinitions) {
    if (definition.id == id) {
      return definition.title;
    }
  }
  return id;
}

int achievementProgressFor(AchievementDefinition definition, Map<String, dynamic> profile) {
  int asInt(Object? value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  return switch (definition.id) {
    'ilk_adim' => asInt(profile['total_questions_answered']),
    'mukemmel_10' || 'bilgi_krali' => asInt(profile['total_correct_answers']),
    'streak_ustasi' => asInt(profile['streak_days']),
    'duello_sampiyonu' => asInt(profile['duel_wins']),
    'milyoner' => asInt(profile['best_millionaire_score']),
    'hiz_seytani' => asInt(profile['fast_correct_answers']),
    'sosyal_kelebek' => asInt(profile['friends_count']),
    _ => 0,
  };
}
