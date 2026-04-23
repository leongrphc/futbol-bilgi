import 'package:flutter/material.dart';

import 'leaderboard_repository.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  String _period = 'weekly';
  String _mode = 'overall';
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<Map<String, dynamic>>> _load() {
    return leaderboardRepository.fetchLeaderboard(period: _period, mode: _mode);
  }

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  String _formatCompact(int value) {
    if (value >= 1000000) {
      final compact = value / 1000000;
      return compact % 1 == 0 ? '${compact.toInt()}M' : '${compact.toStringAsFixed(1)}M';
    }
    if (value >= 1000) {
      final compact = value / 1000;
      return compact % 1 == 0 ? '${compact.toInt()}K' : '${compact.toStringAsFixed(1)}K';
    }
    return '$value';
  }

  int _asInt(Object? value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Leaderboard')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _period,
                    decoration: const InputDecoration(labelText: 'Periyot'),
                    items: const [
                      DropdownMenuItem(value: 'daily', child: Text('Günlük')),
                      DropdownMenuItem(value: 'weekly', child: Text('Haftalık')),
                      DropdownMenuItem(value: 'monthly', child: Text('Aylık')),
                      DropdownMenuItem(value: 'all_time', child: Text('Tüm zamanlar')),
                    ],
                    onChanged: (value) {
                      if (value == null) return;
                      _period = value;
                      _reload();
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _mode,
                    decoration: const InputDecoration(labelText: 'Mod'),
                    items: const [
                      DropdownMenuItem(value: 'overall', child: Text('Genel')),
                      DropdownMenuItem(value: 'millionaire', child: Text('Millionaire')),
                      DropdownMenuItem(value: 'duel', child: Text('Düello')),
                    ],
                    onChanged: (value) {
                      if (value == null) return;
                      _mode = value;
                      _reload();
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
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
                          Text('Leaderboard yüklenemedi: ${snapshot.error}', textAlign: TextAlign.center),
                          const SizedBox(height: 16),
                          FilledButton(onPressed: _reload, child: const Text('Tekrar dene')),
                        ],
                      ),
                    ),
                  );
                }

                final players = snapshot.data ?? const [];
                if (players.isEmpty) {
                  return const Center(child: Text('Henüz gösterilecek oyuncu yok.'));
                }

                return RefreshIndicator(
                  onRefresh: () async => _reload(),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: players.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final player = players[index];
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          color: index < 3 ? theme.colorScheme.primaryContainer : theme.colorScheme.surfaceContainerHighest,
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 22,
                              child: Text('${index + 1}'),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(player['username']?.toString() ?? 'Oyuncu', style: theme.textTheme.titleMedium),
                                  const SizedBox(height: 4),
                                  Text(player['league_tier']?.toString() ?? 'bronze'),
                                ],
                              ),
                            ),
                            Text(
                              _formatCompact(_asInt(player['score'])),
                              style: theme.textTheme.titleLarge,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
