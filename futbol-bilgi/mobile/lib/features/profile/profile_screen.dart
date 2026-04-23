import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'profile_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);

    return profileAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _ProfileStateMessage(
        title: 'Profil alınamadı',
        description: '$error',
        actionLabel: 'Tekrar dene',
        onPressed: () => ref.invalidate(profileProvider),
      ),
      data: (profile) {
        if (profile == null) {
          return _ProfileStateMessage(
            title: 'Profil bulunamadı',
            description: 'Bu hesap için profil kaydı henüz hazır değil.',
            actionLabel: 'Yenile',
            onPressed: () => ref.invalidate(profileProvider),
          );
        }

        final username = profile['username']?.toString() ?? 'Oyuncu';
        final level = _asInt(profile['level']);
        final xp = _asInt(profile['xp']);
        final coins = _asInt(profile['coins']);
        final gems = _asInt(profile['gems']);
        final energy = _asInt(profile['energy']);
        final correctAnswers = _asInt(profile['total_correct_answers']);
        final totalAnswered = _asInt(profile['total_questions_answered']);
        final accuracy = totalAnswered == 0 ? 0 : ((correctAnswers / totalAnswered) * 100).round();

        return RefreshIndicator(
          onRefresh: () async => ref.refresh(profileProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              _ProfileHeroCard(
                username: username,
                level: level,
                xp: xp,
                accuracy: accuracy,
              ),
              const SizedBox(height: 20),
              GridView.count(
                shrinkWrap: true,
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.35,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _StatCard(label: 'Enerji', value: '$energy/5', icon: Icons.bolt_rounded),
                  _StatCard(label: 'Coin', value: _formatCompact(coins), icon: Icons.monetization_on_rounded),
                  _StatCard(label: 'Gem', value: _formatCompact(gems), icon: Icons.diamond_rounded),
                  _StatCard(label: 'Doğruluk', value: '%$accuracy', icon: Icons.track_changes_rounded),
                ],
              ),
              const SizedBox(height: 20),
              _SectionCard(
                title: 'İlerleme',
                child: Column(
                  children: [
                    _InfoRow(label: 'Seviye', value: '$level'),
                    _InfoRow(label: 'Toplam XP', value: _formatCompact(xp)),
                    _InfoRow(label: 'Doğru cevap', value: '$correctAnswers'),
                    _InfoRow(label: 'Toplam soru', value: '$totalAnswered'),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _SectionCard(
                title: 'Mobil durum',
                child: const Column(
                  children: [
                    _InfoRow(label: 'Auth', value: 'Hazır'),
                    _InfoRow(label: 'Profil senkronu', value: 'Aktif'),
                    _InfoRow(label: 'Millionaire', value: 'Bağlanıyor'),
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

class _ProfileHeroCard extends StatelessWidget {
  const _ProfileHeroCard({
    required this.username,
    required this.level,
    required this.xp,
    required this.accuracy,
  });

  final String username;
  final int level;
  final int xp;
  final int accuracy;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
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
          CircleAvatar(
            radius: 28,
            backgroundColor: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.12),
            child: Text(
              username.isEmpty ? 'O' : username.characters.first.toUpperCase(),
              style: theme.textTheme.headlineSmall,
            ),
          ),
          const SizedBox(height: 16),
          Text(username, style: theme.textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('Level $level · $xp XP · %$accuracy doğruluk', style: theme.textTheme.bodyLarge),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
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
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: theme.colorScheme.surfaceContainerHighest,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, size: 24),
          const SizedBox(height: 16),
          Text(value, style: theme.textTheme.titleLarge),
          Text(label, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: theme.colorScheme.surfaceContainer,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: theme.textTheme.titleLarge),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(child: Text(label, style: theme.textTheme.bodyMedium)),
          Text(value, style: theme.textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _ProfileStateMessage extends StatelessWidget {
  const _ProfileStateMessage({
    required this.title,
    required this.description,
    required this.actionLabel,
    required this.onPressed,
  });

  final String title;
  final String description;
  final String actionLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Text(description, textAlign: TextAlign.center),
              const SizedBox(height: 20),
              FilledButton(onPressed: onPressed, child: Text(actionLabel)),
            ],
          ),
        ),
      ),
    );
  }
}
