import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/app_badge.dart';
import '../../core/widgets/glass_card.dart';
import '../profile/profile_provider.dart';

enum _ModeFilter { all, free, energy, daily, recommended }

class PlayScreen extends ConsumerStatefulWidget {
  const PlayScreen({super.key});

  @override
  ConsumerState<PlayScreen> createState() => _PlayScreenState();
}

class _PlayScreenState extends ConsumerState<PlayScreen> {
  _ModeFilter _selectedFilter = _ModeFilter.all;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final profileAsync = ref.watch(profileProvider);

    return profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text('Oyun modları için profil alınamadı: $error'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => ref.invalidate(profileProvider),
              child: const Text('Tekrar dene'),
            ),
          ],
        ),
        data: (profile) {
          final energy = _asInt(profile?['energy']);
          final streak = _asInt(profile?['streak_days']);
          final lastDailyClaim = profile?['last_daily_claim']?.toString();
          final canClaimToday = _canClaimDailyReward(lastDailyClaim);
          final recommendedMode = _recommendedMode(
            energy: energy,
            streak: streak,
            canClaimToday: canClaimToday,
          );
          final visibleModes = _visibleModes(
            selectedFilter: _selectedFilter,
            recommendedMode: recommendedMode,
          );

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(profileProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                GlassCard(
                  variant: GlassCardVariant.highlighted,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 24,
                        child: Icon(Icons.sports_esports_rounded),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Oyun Modları',
                              style: theme.textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Enerji: $energy/5 · Seri: $streak gün',
                              style: theme.textTheme.bodyLarge,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _RecommendedModeCard(
                  mode: recommendedMode,
                  energy: energy,
                  streak: streak,
                  canClaimToday: canClaimToday,
                ),
                const SizedBox(height: 16),
                _ModeFilterBar(
                  selectedFilter: _selectedFilter,
                  onSelected: (filter) {
                    setState(() => _selectedFilter = filter);
                  },
                ),
                const SizedBox(height: 16),
                ...visibleModes.map(
                  (mode) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _GameModeCard(
                      mode: mode,
                      energy: energy,
                      streak: streak,
                      canClaimToday: canClaimToday,
                      highlighted: mode.route == recommendedMode.route &&
                          _selectedFilter != _ModeFilter.recommended,
                    ),
                  ),
                ),
                if (energy < 5) ...[
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      color: theme.colorScheme.surfaceContainerHighest,
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.battery_charging_full_rounded),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Enerji her 30 dakikada yenilenir veya mağazadan doldurulabilir.',
                          ),
                        ),
                        FilledButton.tonal(
                          onPressed: () => context.push('/shop'),
                          child: const Text('Mağaza'),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      );
  }

  int _asInt(Object? value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  bool _canClaimDailyReward(String? lastClaim) {
    if (lastClaim == null || lastClaim.isEmpty) {
      return true;
    }
    final parsed = DateTime.tryParse(lastClaim);
    if (parsed == null) {
      return true;
    }
    final now = DateTime.now();
    return parsed.year != now.year ||
        parsed.month != now.month ||
        parsed.day != now.day;
  }

  _GameMode _recommendedMode({
    required int energy,
    required int streak,
    required bool canClaimToday,
  }) {
    if (canClaimToday) {
      return _gameModes.firstWhere((mode) => mode.daily);
    }
    if (energy <= 0) {
      return _gameModes.firstWhere((mode) => mode.energyCost == 0);
    }
    if (streak >= 3) {
      return _gameModes.firstWhere((mode) => mode.route == '/tournament');
    }
    return _gameModes.firstWhere((mode) => mode.route == '/millionaire');
  }

  List<_GameMode> _visibleModes({
    required _ModeFilter selectedFilter,
    required _GameMode recommendedMode,
  }) {
    return switch (selectedFilter) {
      _ModeFilter.all => _gameModes,
      _ModeFilter.free => _gameModes.where((mode) => mode.energyCost == 0).toList(),
      _ModeFilter.energy => _gameModes.where((mode) => mode.energyCost > 0).toList(),
      _ModeFilter.daily => _gameModes.where((mode) => mode.daily).toList(),
      _ModeFilter.recommended => [recommendedMode],
    };
  }
}

class _ModeFilterBar extends StatelessWidget {
  const _ModeFilterBar({
    required this.selectedFilter,
    required this.onSelected,
  });

  final _ModeFilter selectedFilter;
  final ValueChanged<_ModeFilter> onSelected;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final filter in _ModeFilter.values) ...[
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(_filterLabel(filter)),
                selected: selectedFilter == filter,
                onSelected: (_) => onSelected(filter),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _filterLabel(_ModeFilter filter) {
    return switch (filter) {
      _ModeFilter.all => 'Tümü',
      _ModeFilter.free => 'Ücretsiz',
      _ModeFilter.energy => 'Enerjili',
      _ModeFilter.daily => 'Günlük',
      _ModeFilter.recommended => 'Önerilen',
    };
  }
}

class _RecommendedModeCard extends StatelessWidget {
  const _RecommendedModeCard({
    required this.mode,
    required this.energy,
    required this.streak,
    required this.canClaimToday,
  });

  final _GameMode mode;
  final int energy;
  final int streak;
  final bool canClaimToday;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final reason = canClaimToday
        ? 'Günlük serini korumak için önce bunu bitir.'
        : energy <= 0
            ? 'Şu an enerjisiz oynayabileceğin en iyi mod bu.'
            : streak >= 3
                ? 'Serin yükselmişken daha yüksek ödüllü moda geç.'
                : 'Bugünkü ana koşun için en dengeli başlangıç bu mod.';

    return GlassCard(
      variant: GlassCardVariant.highlighted,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const AppBadge(
                label: 'Senin için',
                icon: Icons.auto_awesome_rounded,
                tone: AppBadgeTone.premium,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(mode.title, style: theme.textTheme.titleLarge),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(reason, style: theme.textTheme.bodyMedium),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => context.push(mode.route),
              icon: Icon(mode.icon),
              label: Text(mode.duelCta ? 'Hemen Eşleş' : 'Modu Aç'),
            ),
          ),
        ],
      ),
    );
  }
}

class _GameMode {
  const _GameMode({
    required this.title,
    required this.description,
    required this.route,
    required this.energyCost,
    required this.rules,
    required this.reward,
    required this.icon,
    required this.color,
    this.duelCta = false,
    this.daily = false,
  });

  final String title;
  final String description;
  final String route;
  final int energyCost;
  final List<String> rules;
  final String reward;
  final IconData icon;
  final Color color;
  final bool duelCta;
  final bool daily;
}

const _gameModes = [
  _GameMode(
    title: 'Milyoner Yarışması',
    description: '15 soru, güvenli noktalar ve jokerlerle ana yarışma.',
    route: '/millionaire',
    energyCost: 1,
    rules: [
      '15 soru, artan zorluk',
      '5. ve 10. soruda güvenli nokta',
      'Yanlış cevapta güvenli ödüle düşersin',
    ],
    reward: '1M puana kadar kazanç',
    icon: Icons.emoji_events_rounded,
    color: Colors.green,
  ),
  _GameMode(
    title: 'Hızlı Maç',
    description: 'Zamana karşı 10 soruluk hızlı yarış.',
    route: '/quick',
    energyCost: 0,
    rules: [
      '10 soru, 120 saniye',
      'Her doğru cevap +100 puan',
      'Yanlış cevapta ceza yok',
    ],
    reward: 'Ücretsiz XP ve coin kazanımı',
    icon: Icons.flash_on_rounded,
    color: Colors.amber,
  ),
  _GameMode(
    title: 'Düello',
    description: 'Mock rakibe karşı 5 soruluk 1v1 bilgi yarışı.',
    route: '/duel',
    energyCost: 1,
    rules: [
      'Aynı 5 soru, 2 oyuncu',
      'Doğru cevap ve hız bonusu puan getirir',
      'Beraberlikte toplam süre belirleyici olur',
    ],
    reward: 'Kazanana XP, coin ve ELO ödülü',
    icon: Icons.sports_martial_arts_rounded,
    color: Colors.deepOrange,
    duelCta: true,
  ),
  _GameMode(
    title: 'Günlük Meydan Okuma',
    description: 'Her gün yeni 5 özel soru.',
    route: '/daily',
    energyCost: 0,
    rules: [
      'Günde 1 kez oynanabilir',
      '5 özel seçilmiş soru',
      'Streak bonusu kazandırır',
    ],
    reward: 'Günlük bonus ve seri çarpanı',
    icon: Icons.calendar_today_rounded,
    color: Colors.purple,
    daily: true,
  ),
  _GameMode(
    title: 'Turnuva Modu',
    description: '3 turlu eleme serisi.',
    route: '/tournament',
    energyCost: 1,
    rules: [
      'Çeyrek final, yarı final, final formatı',
      'Her tur 4 soru içerir',
      'İleri turda zorluk artar',
    ],
    reward: 'Tamamlayana büyük XP ve coin bonusu',
    icon: Icons.military_tech_rounded,
    color: Colors.blue,
  ),
];

class _GameModeCard extends StatelessWidget {
  const _GameModeCard({
    required this.mode,
    required this.energy,
    required this.streak,
    required this.canClaimToday,
    this.highlighted = false,
  });

  final _GameMode mode;
  final int energy;
  final int streak;
  final bool canClaimToday;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasEnergy = energy >= mode.energyCost;
    final canPlay = mode.energyCost == 0 || hasEnergy;

    return GlassCard(
      variant: highlighted ? GlassCardVariant.highlighted : GlassCardVariant.elevated,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(24),
              ),
              color: mode.color.withValues(alpha: 0.14),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 25,
                  backgroundColor: mode.color.withValues(alpha: 0.20),
                  child: Icon(mode.icon, color: mode.color),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(mode.title, style: theme.textTheme.titleLarge),
                      const SizedBox(height: 4),
                      Text(mode.description),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Kurallar', style: theme.textTheme.titleSmall),
                const SizedBox(height: 8),
                for (final rule in mode.rules)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('• '),
                        Expanded(child: Text(rule)),
                      ],
                    ),
                  ),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: theme.colorScheme.surface,
                  ),
                  child: Text('Ödül: ${mode.reward}'),
                ),
                if (mode.daily) ...[
                  const SizedBox(height: 10),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      color: theme.colorScheme.tertiaryContainer,
                    ),
                    child: Text(
                      canClaimToday
                          ? 'Bugünün serisi için ödül alınabilir. Mevcut seri: $streak gün.'
                          : 'Bugünün serisi korunmuş. Mevcut seri: $streak gün.',
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: AppBadge(
                        label: mode.energyCost == 0
                            ? 'Ücretsiz'
                            : '${mode.energyCost} enerji',
                        tone: canPlay ? AppBadgeTone.primary : AppBadgeTone.danger,
                      ),
                    ),
                    FilledButton(
                      onPressed: canPlay
                          ? () => context.push(mode.route)
                          : null,
                      child: Text(mode.duelCta ? 'Eşleş' : 'Oyna'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
