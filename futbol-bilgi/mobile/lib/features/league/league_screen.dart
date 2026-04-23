import 'package:flutter/material.dart';

import 'league_repository.dart';

class LeagueScreen extends StatefulWidget {
  const LeagueScreen({super.key});

  @override
  State<LeagueScreen> createState() => _LeagueScreenState();
}

class _LeagueScreenState extends State<LeagueScreen> {
  late Future<_LeaguePayload> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_LeaguePayload> _load() async {
    final season = await leagueRepository.fetchCurrentSeason();
    final entries = await leagueRepository.fetchEntries(seasonId: season?['id']?.toString());
    return _LeaguePayload(season: season, entries: entries);
  }

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  String _zoneLabel(int rank, int total) {
    if (total <= 0) return 'Belirsiz';
    if (rank <= (total / 4).ceil()) return 'Terfi Hattı';
    if (rank > total - (total / 4).ceil()) return 'Düşme Hattı';
    return 'Güvende';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('League')),
      body: FutureBuilder<_LeaguePayload>(
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
                    Text('League verisi alınamadı: ${snapshot.error}', textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(onPressed: _reload, child: const Text('Tekrar dene')),
                  ],
                ),
              ),
            );
          }

          final payload = snapshot.data!;
          final season = payload.season;
          final entries = payload.entries;

          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              padding: const EdgeInsets.all(20),
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
                      Text('Haftalık Lig', style: theme.textTheme.headlineSmall),
                      const SizedBox(height: 8),
                      Text('Aktif sezon: ${season?['name'] ?? 'Bilinmiyor'}', style: theme.textTheme.bodyLarge),
                      if (season?['ends_at'] != null) ...[
                        const SizedBox(height: 4),
                        Text('Bitiş: ${season!['ends_at']}'),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text('Lig Tablosu', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                if (entries.isEmpty)
                  const Text('Bu sezon için henüz giriş yok.')
                else
                  ...entries.take(20).toList().asMap().entries.map((entry) {
                    final index = entry.key;
                    final item = entry.value;
                    final rank = index + 1;
                    final zone = _zoneLabel(rank, entries.length);
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          color: theme.colorScheme.surfaceContainerHighest,
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(radius: 20, child: Text('$rank')),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item['user_id']?.toString() ?? '-', style: theme.textTheme.titleMedium),
                                  const SizedBox(height: 4),
                                  Text(zone),
                                ],
                              ),
                            ),
                            Text('${item['season_score'] ?? 0}', style: theme.textTheme.titleLarge),
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _LeaguePayload {
  const _LeaguePayload({required this.season, required this.entries});

  final Map<String, dynamic>? season;
  final List<Map<String, dynamic>> entries;
}
