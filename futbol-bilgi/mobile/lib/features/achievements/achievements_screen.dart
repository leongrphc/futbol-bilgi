import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/widgets/app_badge.dart';
import '../../core/widgets/app_progress_bar.dart';
import '../../core/widgets/glass_card.dart';
import '../league/league_repository.dart';
import '../profile/profile_provider.dart';
import 'achievement_models.dart';
import 'achievements_repository.dart';

class AchievementsScreen extends ConsumerStatefulWidget {
  const AchievementsScreen({super.key});

  @override
  ConsumerState<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends ConsumerState<AchievementsScreen> {
  late Future<Map<String, dynamic>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() async {
    final season = await leagueRepository.fetchCurrentSeason();
    final entries = await leagueRepository.fetchEntries(
      seasonId: season?['id']?.toString(),
    );
    final payload = await achievementsRepository.syncAchievements(
      leagueEntries: entries,
      currentSeasonId: season?['id']?.toString(),
    );
    ref.invalidate(profileProvider);
    return payload;
  }

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  int _asInt(Object? value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Achievements')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Achievement senkronu başarısız: ${snapshot.error}',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: _reload,
                      child: const Text('Tekrar dene'),
                    ),
                  ],
                ),
              ),
            );
          }

          final payload = snapshot.data ?? <String, dynamic>{};
          final unlocked =
              (payload['newlyUnlocked'] as List<dynamic>? ?? const [])
                  .map((e) => e.toString())
                  .toList();
          final rewards = Map<String, dynamic>.from(
            payload['rewards'] as Map? ?? <String, dynamic>{},
          );
          final profile = Map<String, dynamic>.from(
            payload['profile'] as Map? ?? <String, dynamic>{},
          );
          final achievementCards = achievementDefinitions
              .map(
                (definition) => _AchievementProgress(
                  definition: definition,
                  progress: achievementProgressFor(definition, profile),
                  newlyUnlocked: unlocked.contains(definition.id),
                ),
              )
              .toList()
            ..sort((a, b) {
              if (a.newlyUnlocked != b.newlyUnlocked) {
                return a.newlyUnlocked ? -1 : 1;
              }
              if (a.completed != b.completed) {
                return a.completed ? -1 : 1;
              }
              return b.ratio.compareTo(a.ratio);
            });
          final completedCount = achievementCards
              .where((item) => item.completed)
              .length;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              GlassCard(
                variant: GlassCardVariant.highlighted,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Başarımlar', style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      '$completedCount/${achievementDefinitions.length} başarım tamamlandı.',
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Yeni açılan: ${unlocked.isEmpty ? 'Yok' : unlocked.map(achievementTitle).join(', ')}',
                    ),
                    if (unlocked.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      _UnlockedBanner(unlocked: unlocked),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 20),
              GridView.count(
                shrinkWrap: true,
                crossAxisCount: 3,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.1,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _RewardCard(
                    label: 'Coin',
                    value: '+${_asInt(rewards['coins'])}',
                    icon: Icons.monetization_on_rounded,
                  ),
                  _RewardCard(
                    label: 'Gem',
                    value: '+${_asInt(rewards['gems'])}',
                    icon: Icons.diamond_rounded,
                  ),
                  _RewardCard(
                    label: 'XP',
                    value: '+${_asInt(rewards['xp'])}',
                    icon: Icons.auto_awesome_rounded,
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text('Katalog', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              ...achievementCards.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _AchievementCard(item: item),
                ),
              ),
              const SizedBox(height: 8),
              FilledButton.icon(
                onPressed: _reload,
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(54),
                ),
                icon: const Icon(Icons.sync_rounded),
                label: const Text('Başarımları Yeniden Senkronla'),
              ),
            ],
          );
        },
      ),
    );
  }

}

class _AchievementProgress {
  const _AchievementProgress({
    required this.definition,
    required this.progress,
    required this.newlyUnlocked,
  });

  final AchievementDefinition definition;
  final int progress;
  final bool newlyUnlocked;

  bool get completed => newlyUnlocked || progress >= definition.target;
  double get ratio => definition.target <= 0
      ? 0
      : (progress / definition.target).clamp(0, 1).toDouble();
}

class _UnlockedBanner extends StatelessWidget {
  const _UnlockedBanner({required this.unlocked});

  final List<String> unlocked;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: theme.colorScheme.primaryContainer,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppBadge(
            label: 'Yeni açıldı',
            icon: Icons.auto_awesome_rounded,
            tone: AppBadgeTone.success,
          ),
          const SizedBox(height: 10),
          Text(
            unlocked.length == 1
                ? '${achievementTitle(unlocked.first)} artık senin.'
                : '${unlocked.length} yeni başarım açtın.',
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: 6),
          Text(
            unlocked.map(achievementTitle).join(' • '),
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  const _RewardCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GlassCard(
      variant: GlassCardVariant.elevated,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon),
          const Spacer(),
          Text(value, style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _AchievementCard extends StatelessWidget {
  const _AchievementCard({required this.item});

  final _AchievementProgress item;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final definition = item.definition;
    final rewardParts = [
      '+${definition.coins} coin',
      if (definition.gems > 0) '+${definition.gems} gem',
      '+${definition.xp} XP',
    ];

    return GlassCard(
      variant: item.completed ? GlassCardVariant.highlighted : GlassCardVariant.elevated,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                backgroundColor: item.completed
                    ? theme.colorScheme.primary
                    : theme.colorScheme.surfaceContainerHighest,
                foregroundColor: item.completed
                    ? theme.colorScheme.onPrimary
                    : theme.colorScheme.onSurfaceVariant,
                child: Icon(definition.icon),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            definition.title,
                            style: theme.textTheme.titleMedium,
                          ),
                        ),
                        if (item.newlyUnlocked)
                          const Icon(Icons.new_releases_rounded, size: 20),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      definition.description,
                      style: theme.textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          AppProgressBar(
            value: item.ratio,
            tone: item.completed ? AppProgressTone.success : AppProgressTone.gold,
            height: 8,
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Text(
                  '${item.progress.clamp(0, definition.target)} / ${definition.target}',
                  style: theme.textTheme.labelLarge,
                ),
              ),
              Text(
                '${definition.category} • ${definition.rarity}',
                style: theme.textTheme.labelMedium,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            rewardParts.join(' • '),
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
