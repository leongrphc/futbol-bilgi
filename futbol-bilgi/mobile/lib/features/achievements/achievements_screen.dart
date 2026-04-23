import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../league/league_repository.dart';
import '../profile/profile_provider.dart';
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
    final entries = await leagueRepository.fetchEntries(seasonId: season?['id']?.toString());
    return achievementsRepository.syncAchievements(
      leagueEntries: entries,
      currentSeasonId: season?['id']?.toString(),
    );
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
                    Text('Achievement senkronu başarısız: ${snapshot.error}', textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(onPressed: _reload, child: const Text('Tekrar dene')),
                  ],
                ),
              ),
            );
          }

          final payload = snapshot.data ?? <String, dynamic>{};
          final unlocked = (payload['newlyUnlocked'] as List<dynamic>? ?? const []).map((e) => e.toString()).toList();
          final rewards = Map<String, dynamic>.from(payload['rewards'] as Map? ?? <String, dynamic>{});

          ref.invalidate(profileProvider);

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primaryContainer,
                      theme.colorScheme.tertiaryContainer,
                    ],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Achievement Sync', style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text('Yeni açılan başarım: ${unlocked.isEmpty ? 'Yok' : unlocked.join(', ')}'),
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
                  _RewardCard(label: 'Coin', value: '+${_asInt(rewards['coins'])}', icon: Icons.monetization_on_rounded),
                  _RewardCard(label: 'Gem', value: '+${_asInt(rewards['gems'])}', icon: Icons.diamond_rounded),
                  _RewardCard(label: 'XP', value: '+${_asInt(rewards['xp'])}', icon: Icons.auto_awesome_rounded),
                ],
              ),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _reload,
                style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
                icon: const Icon(Icons.sync_rounded),
                label: const Text('Achievements Yeniden Senkronla'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _RewardCard extends StatelessWidget {
  const _RewardCard({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        color: theme.colorScheme.surfaceContainerHighest,
      ),
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
