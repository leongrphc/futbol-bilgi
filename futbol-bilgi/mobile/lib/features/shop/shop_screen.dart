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
  String? _activeTab = 'themes';

  static const _utilityItems = [
    ('joker_fifty_fifty', '50/50 Joker'),
    ('joker_audience', 'Seyirci Jokeri'),
    ('joker_phone', 'Telefon Jokeri'),
    ('joker_freeze_time', 'Süre Dondur'),
    ('joker_skip', 'Pas Geç'),
    ('joker_double_answer', 'Çift Cevap'),
    ('energy_refill_small', '+1 Enerji'),
  ];

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Map<String, dynamic>> _load() {
    return shopRepository.fetchThemes();
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
          final shopItems = (payload['shopItems'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
          final inventory = (payload['inventory'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
          final ownedItemIds = inventory.map((item) => item['item_id']?.toString()).whereType<String>().toSet();
          final equippedItemIds = inventory.where((item) => item['is_equipped'] == true).map((item) => item['item_id']?.toString()).whereType<String>().toSet();

          final themeItems = shopItems.where((item) => item['item_type'] == 'theme').toList();

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'themes', label: Text('Temalar')),
                  ButtonSegment(value: 'utility', label: Text('Joker/Enerji')),
                ],
                selected: {_activeTab!},
                onSelectionChanged: (selection) => setState(() => _activeTab = selection.first),
              ),
              if (_message != null) ...[
                const SizedBox(height: 16),
                Text(_message!),
              ],
              const SizedBox(height: 16),
              if (_activeTab == 'themes') ...[
                Text('Temalar', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                ...themeItems.map((item) {
                  final id = item['id']?.toString() ?? '';
                  final isOwned = ownedItemIds.contains(id) || id == 'theme-dark-default';
                  final isEquipped = equippedItemIds.contains(id) || (item['theme_key']?.toString() == 'dark' && !equippedItemIds.isNotEmpty);
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(22),
                        color: theme.colorScheme.surfaceContainerHighest,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item['name']?.toString() ?? 'Tema', style: theme.textTheme.titleMedium),
                          const SizedBox(height: 4),
                          Text(item['description']?.toString() ?? ''),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(child: Text('Coin: ${item['price_coins'] ?? 0} · Gem: ${item['price_gems'] ?? 0}')),
                              if (isOwned)
                                FilledButton.tonal(
                                  onPressed: () => _equipTheme(id == 'theme-dark-default' ? 'theme-dark-default' : id),
                                  child: Text(isEquipped ? 'Kuşanılı' : 'Kuşan'),
                                )
                              else
                                FilledButton(
                                  onPressed: () => _buyTheme(id),
                                  child: const Text('Satın Al'),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ] else ...[
                Text('Joker ve Enerji', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                ..._utilityItems.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          color: theme.colorScheme.surfaceContainerHighest,
                        ),
                        child: Row(
                          children: [
                            Expanded(child: Text(item.$2)),
                            FilledButton(
                              onPressed: () => _buyUtility(item.$1),
                              child: const Text('Satın Al'),
                            ),
                          ],
                        ),
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
