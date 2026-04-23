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
              onPlayMillionaire: () => context.push('/millionaire'),
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
    required this.onPlayMillionaire,
  });

  final String? email;
  final String? fallbackUsername;
  final VoidCallback onPlayMillionaire;

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

        return RefreshIndicator(
          onRefresh: () async => ref.refresh(profileProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primaryContainer,
                      theme.colorScheme.secondaryContainer,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hoş geldin, $username', style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      'Level $level · ${_formatCompact(xp)} XP · ${_formatCompact(coins)} coin',
                      style: theme.textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: [
                        _ChipStat(label: 'Enerji', value: '$energy/5', icon: Icons.bolt_rounded),
                        _ChipStat(label: 'API', value: 'Bağlı', icon: Icons.cloud_done_rounded),
                        _ChipStat(label: 'Auth', value: 'Aktif', icon: Icons.verified_user_rounded),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  color: theme.colorScheme.surfaceContainerHighest,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Millionaire', style: theme.textTheme.titleLarge),
                    const SizedBox(height: 8),
                    const Text('15 soruluk akış, güvenli noktalar ve oyun sonu ödül senkronu ile mobil için hazırlanıyor.'),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: onPlayMillionaire,
                      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56)),
                      icon: const Icon(Icons.emoji_events_rounded),
                      label: const Text('Millionaire Başlat'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  int _asInt(Object? value) {
    if (value is int) {
      return value;
    }
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
  const _ChipStat({
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
