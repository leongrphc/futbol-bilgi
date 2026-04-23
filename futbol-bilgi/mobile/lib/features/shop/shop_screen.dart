import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../profile/profile_provider.dart';
import 'shop_repository.dart';

class ShopScreen extends ConsumerStatefulWidget {
  const ShopScreen({super.key});

  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  late Future<Map<String, dynamic>> _future;
  String? _message;
  String _activeTab = 'themes';

  static const _utilityItems = [
    ('joker_fifty_fifty', '50/50 Joker', 'İki yanlış şıkkı eler.'),
    ('joker_audience', 'Seyirci Jokeri', 'Seyirci dağılımını gösterir.'),
    ('joker_phone', 'Telefon Jokeri', 'Tahmini doğru cevabı söyler.'),
    ('joker_freeze_time', 'Süre Dondur', 'Ek süre kazandırır.'),
    ('joker_skip', 'Pas Geç', 'Soruyu değiştirir.'),
    ('joker_double_answer', 'Çift Cevap', 'Bir yanlış tahmin hakkı verir.'),
    ('energy_refill_small', '+1 Enerji', 'Hemen 1 enerji doldurur.'),
  ];

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() {
    return shopRepository.fetchShopBundle();
  }

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  Future<void> _buyTheme(String itemId) async {
    try {
      await shopRepository.buyTheme(itemId);
      setState(() => _message = 'Tema satın alındı.');
      ref.invalidate(profileProvider);
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _equipTheme(String itemId) async {
    try {
      await shopRepository.equipTheme(itemId);
      setState(() => _message = 'Tema kuşanıldı.');
      ref.invalidate(profileProvider);
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _buyFrame(String itemId) async {
    try {
      await shopRepository.buyFrame(itemId);
      setState(() => _message = 'Frame satın alındı.');
      ref.invalidate(profileProvider);
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _equipFrame(String frameKey) async {
    try {
      await shopRepository.equipFrame(frameKey);
      setState(() => _message = 'Frame kuşanıldı.');
      ref.invalidate(profileProvider);
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _buyUtility(String itemKey) async {
    try {
      await shopRepository.buyUtility(itemKey);
      setState(() => _message = 'Satın alma tamamlandı.');
      ref.invalidate(profileProvider);
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Mağaza')),
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
                    Text('Mağaza yüklenemedi: ${snapshot.error}', textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(onPressed: _reload, child: const Text('Tekrar dene')),
                  ],
                ),
              ),
            );
          }

          final payload = snapshot.data ?? <String, dynamic>{};
          final themeItems = (payload['themeShopItems'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
          final themeInventory = (payload['themeInventory'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
          final frameItems = (payload['frameShopItems'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
          final frameInventory = (payload['frameInventory'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
          final ownedThemeItemIds = themeInventory.map((item) => item['item_id']?.toString()).whereType<String>().toSet();
          final equippedThemeItemIds = themeInventory.where((item) => item['is_equipped'] == true).map((item) => item['item_id']?.toString()).whereType<String>().toSet();
          final ownedFrameItemIds = frameInventory.map((item) => item['item_id']?.toString()).whereType<String>().toSet();

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  gradient: LinearGradient(
                    colors: [theme.colorScheme.primaryContainer, theme.colorScheme.tertiaryContainer],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Mağaza', style: theme.textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text('Tema, frame, joker ve enerji ile hesabını zenginleştir.', style: theme.textTheme.bodyLarge),
                  ],
                ),
              ),
              if (_message != null) ...[
                const SizedBox(height: 16),
                Text(_message!),
              ],
              const SizedBox(height: 20),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ChoiceChip(label: const Text('Temalar'), selected: _activeTab == 'themes', onSelected: (_) => setState(() => _activeTab = 'themes')),
                  ChoiceChip(label: const Text('Frame'), selected: _activeTab == 'frames', onSelected: (_) => setState(() => _activeTab = 'frames')),
                  ChoiceChip(label: const Text('Joker / Enerji'), selected: _activeTab == 'utility', onSelected: (_) => setState(() => _activeTab = 'utility')),
                ],
              ),
              const SizedBox(height: 20),
              if (_activeTab == 'themes') ...[
                Text('Temalar', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                ...themeItems.map((item) {
                  final id = item['id']?.toString() ?? '';
                  final isOwned = ownedThemeItemIds.contains(id) || id == 'theme-dark-default';
                  final isEquipped = equippedThemeItemIds.contains(id) || (item['theme_key']?.toString() == 'dark' && equippedThemeItemIds.isEmpty);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _ShopCard(
                      title: item['name']?.toString() ?? 'Tema',
                      description: item['description']?.toString() ?? '',
                      priceLabel: 'Coin: ${item['price_coins'] ?? 0} · Gem: ${item['price_gems'] ?? 0}',
                      actionLabel: isOwned ? (isEquipped ? 'Kuşanılı' : 'Kuşan') : 'Satın Al',
                      onPressed: isOwned ? () => _equipTheme(id == 'theme-dark-default' ? 'theme-dark-default' : id) : () => _buyTheme(id),
                    ),
                  );
                }),
              ] else if (_activeTab == 'frames') ...[
                Text('Frame', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                ...frameItems.map((item) {
                  final id = item['id']?.toString() ?? '';
                  final frameKey = item['frame_key']?.toString() ?? 'default';
                  final isOwned = ownedFrameItemIds.contains(id);
                  final isEquipped = frameInventory.any((entry) => entry['item_id']?.toString() == id && entry['is_equipped'] == true);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _ShopCard(
                      title: item['name']?.toString() ?? 'Frame',
                      description: item['description']?.toString() ?? '',
                      priceLabel: 'Coin: ${item['price_coins'] ?? 0} · Gem: ${item['price_gems'] ?? 0}',
                      actionLabel: isOwned ? (isEquipped ? 'Kuşanılı' : 'Kuşan') : 'Satın Al',
                      onPressed: isOwned ? () => _equipFrame(frameKey) : () => _buyFrame(id),
                    ),
                  );
                }),
              ] else ...[
                Text('Joker ve Enerji', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                ..._utilityItems.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _ShopCard(
                        title: item.$2,
                        description: item.$3,
                        priceLabel: 'Coin ile satın al',
                        actionLabel: 'Satın Al',
                        onPressed: () => _buyUtility(item.$1),
                      ),
                    )),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _ShopCard extends StatelessWidget {
  const _ShopCard({
    required this.title,
    required this.description,
    required this.priceLabel,
    required this.actionLabel,
    required this.onPressed,
  });

  final String title;
  final String description;
  final String priceLabel;
  final String actionLabel;
  final VoidCallback onPressed;

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
        children: [
          Text(title, style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text(description),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: Text(priceLabel)),
              FilledButton.tonal(onPressed: onPressed, child: Text(actionLabel)),
            ],
          ),
        ],
      ),
    );
  }
}
