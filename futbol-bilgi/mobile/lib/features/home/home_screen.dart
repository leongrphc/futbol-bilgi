import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../profile/profile_provider.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _index = 0;

  Future<void> _signOut() async {
    try {
      await Supabase.instance.client.auth.signOut();
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = Supabase.instance.client.auth.currentSession;
    final user = session?.user;
    final titles = ['Ana Sayfa', 'Profil'];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_index]),
        actions: [
          IconButton(
            onPressed: _signOut,
            tooltip: 'Çıkış yap',
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: IndexedStack(
          index: _index,
          children: [
            _HomeOverview(
              email: user?.email,
              fallbackUsername: user?.userMetadata?['username']?.toString(),
            ),
            const ProfileScreen(),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.sports_soccer_outlined),
            selectedIcon: Icon(Icons.sports_soccer),
            label: 'Ana Sayfa',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}

class _HomeOverview extends ConsumerWidget {
  const _HomeOverview({
    required this.email,
    required this.fallbackUsername,
  });

  final String? email;
  final String? fallbackUsername;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final profileAsync = ref.watch(profileProvider);

    return profileAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text('Profil özetini alırken hata oluştu: $error'),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => ref.invalidate(profileProvider),
            child: const Text('Tekrar dene'),
          ),
        ],
      ),
      data: (profile) {
        final username = profile?['username']?.toString() ?? fallbackUsername ?? email?.split('@').first ?? 'Oyuncu';
        final energy = _asInt(profile?['energy']);
        final level = _asInt(profile?['level']);
        final coins = _asInt(profile?['coins']);
        final xp = _asInt(profile?['xp']);
        final gems = _asInt(profile?['gems']);
        final correctAnswers = _asInt(profile?['total_correct_answers']);
        final totalAnswered = _asInt(profile?['total_questions_answered']);
        final accuracy = totalAnswered == 0 ? 0 : ((correctAnswers / totalAnswered) * 100).round();

        return RefreshIndicator(
          onRefresh: () async => ref.refresh(profileProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(32),
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primaryContainer,
                      theme.colorScheme.tertiaryContainer,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Merhaba, $username', style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      'Level $level · ${_formatCompact(xp)} XP · %$accuracy doğruluk',
                      style: theme.textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 18),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        _ChipStat(label: 'Enerji', value: '$energy/5', icon: Icons.bolt_rounded),
                        _ChipStat(label: 'Coin', value: _formatCompact(coins), icon: Icons.monetization_on_rounded),
                        _ChipStat(label: 'Gem', value: _formatCompact(gems), icon: Icons.diamond_rounded),
                        _ChipStat(label: 'Doğru', value: '$correctAnswers/$totalAnswered', icon: Icons.track_changes_rounded),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text('Oyun Modları', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              GridView.count(
                shrinkWrap: true,
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.95,
                physics: const NeverScrollableScrollPhysics(),
                children: const [
                  _ModeTile(title: 'Millionaire', description: 'Ana yarışma', badge: '1 ⚡', icon: Icons.emoji_events_rounded, route: '/millionaire'),
                  _ModeTile(title: 'Quick', description: '10 soru / 120 sn', badge: 'Ücretsiz', icon: Icons.flash_on_rounded, route: '/quick'),
                  _ModeTile(title: 'Daily', description: 'Bugünün 5 sorusu', badge: 'Günlük', icon: Icons.calendar_today_rounded, route: '/daily'),
                  _ModeTile(title: 'Düello', description: '1v1 hız maçı', badge: '1 ⚡', icon: Icons.sports_martial_arts_rounded, route: '/duel'),
                  _ModeTile(title: 'Tournament', description: '3 tur eleme', badge: 'Canlı', icon: Icons.military_tech_rounded, route: '/tournament'),
                  _ModeTile(title: 'Mağaza', description: 'Tema / frame / joker', badge: 'Shop', icon: Icons.storefront_rounded, route: '/shop'),
                ],
              ),
              const SizedBox(height: 20),
              Text('Rekabet ve Sosyal', style: theme.textTheme.titleLarge),
              const SizedBox(height: 12),
              _FeatureStrip(
                title: 'Leaderboard',
                description: 'Genel, millionaire ve düello sıralamalarını gör.',
                icon: Icons.leaderboard_rounded,
                route: '/leaderboard',
              ),
              const SizedBox(height: 12),
              _FeatureStrip(
                title: 'League',
                description: 'Aktif sezonu ve haftalık pozisyonunu takip et.',
                icon: Icons.shield_rounded,
                route: '/league',
              ),
              const SizedBox(height: 12),
              _FeatureStrip(
                title: 'Achievements',
                description: 'Başarım ödüllerini ve açılan rozetleri gör.',
                icon: Icons.workspace_premium_rounded,
                route: '/achievements',
              ),
              const SizedBox(height: 12),
              _FeatureStrip(
                title: 'Social',
                description: 'Arkadaşlar, davetler ve düello girişleri.',
                icon: Icons.groups_rounded,
                route: '/social',
              ),
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
}

class _ChipStat extends StatelessWidget {
  const _ChipStat({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.08),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 8),
          Text('$label: $value', style: theme.textTheme.labelLarge),
        ],
      ),
    );
  }
}

class _ModeTile extends StatelessWidget {
  const _ModeTile({
    required this.title,
    required this.description,
    required this.badge,
    required this.icon,
    required this.route,
  });

  final String title;
  final String description;
  final String badge;
  final IconData icon;
  final String route;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: () => context.push(route),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: theme.colorScheme.surfaceContainerHighest,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Icon(icon),
            ),
            const Spacer(),
            Text(title, style: theme.textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(description, maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                color: theme.colorScheme.primaryContainer,
              ),
              child: Text(badge, style: theme.textTheme.labelMedium),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureStrip extends StatelessWidget {
  const _FeatureStrip({
    required this.title,
    required this.description,
    required this.icon,
    required this.route,
  });

  final String title;
  final String description;
  final IconData icon;
  final String route;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: () => context.push(route),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: theme.colorScheme.surfaceContainerHighest,
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Icon(icon),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(description),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_rounded),
          ],
        ),
      ),
    );
  }
}
