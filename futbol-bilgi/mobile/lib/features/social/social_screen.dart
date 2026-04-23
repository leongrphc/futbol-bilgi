import 'package:flutter/material.dart';

import 'social_repository.dart';

class SocialScreen extends StatefulWidget {
  const SocialScreen({super.key});

  @override
  State<SocialScreen> createState() => _SocialScreenState();
}

class _SocialScreenState extends State<SocialScreen> {
  late Future<Map<String, dynamic>> _future;
  final _usernameController = TextEditingController();
  String? _message;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    super.dispose();
  }

  Future<Map<String, dynamic>> _load() {
    return socialRepository.fetchSnapshot();
  }

  void _reload() {
    setState(() {
      _future = _load();
    });
  }

  Future<void> _sendFriendRequest() async {
    final username = _usernameController.text.trim();
    if (username.isEmpty) {
      setState(() => _message = 'Kullanıcı adı gir.');
      return;
    }

    try {
      await socialRepository.sendFriendRequest(username);
      _usernameController.clear();
      setState(() => _message = 'Arkadaş isteği gönderildi.');
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _acceptRequest(String requesterId) async {
    try {
      await socialRepository.acceptFriendRequest(requesterId);
      setState(() => _message = 'Arkadaş isteği kabul edildi.');
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _rejectRequest(String requesterId) async {
    try {
      await socialRepository.rejectFriendRequest(requesterId);
      setState(() => _message = 'Arkadaş isteği reddedildi.');
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  Future<void> _sendDuelInvite(String toUserId) async {
    try {
      await socialRepository.sendDuelInvite(toUserId);
      setState(() => _message = 'Düello daveti gönderildi.');
      _reload();
    } catch (error) {
      setState(() => _message = error.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Social')),
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
                    Text('Sosyal veriler alınamadı: ${snapshot.error}', textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    FilledButton(onPressed: _reload, child: const Text('Tekrar dene')),
                  ],
                ),
              ),
            );
          }

          final payload = snapshot.data ?? <String, dynamic>{};
          final profiles = (payload['profiles'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
          final friendships = (payload['friendships'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();
          final invites = (payload['duelInvites'] as List<dynamic>? ?? const []).map((e) => Map<String, dynamic>.from(e as Map)).toList();

          final acceptedFriendIds = friendships.where((item) => item['status'] == 'accepted').map((item) => item['friend_id']?.toString()).whereType<String>().toSet();
          final pendingIncoming = friendships.where((item) => item['status'] == 'pending').toList();

          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    color: theme.colorScheme.surfaceContainerHighest,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Arkadaş ekle', style: theme.textTheme.titleLarge),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _usernameController,
                        decoration: const InputDecoration(labelText: 'Kullanıcı adı'),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _sendFriendRequest, child: const Text('İstek Gönder')),
                      if (_message != null) ...[
                        const SizedBox(height: 12),
                        Text(_message!),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Text('Bekleyen istekler', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                if (pendingIncoming.isEmpty)
                  const Text('Bekleyen arkadaş isteği yok.')
                else
                  ...pendingIncoming.map((item) {
                    final requesterId = item['user_id']?.toString() ?? '';
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          color: theme.colorScheme.surfaceContainerHighest,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('İstek gönderen: $requesterId'),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(child: FilledButton(onPressed: () => _acceptRequest(requesterId), child: const Text('Kabul'))),
                                const SizedBox(width: 12),
                                Expanded(child: OutlinedButton(onPressed: () => _rejectRequest(requesterId), child: const Text('Reddet'))),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                const SizedBox(height: 20),
                Text('Oyuncular', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                ...profiles.map((profile) {
                  final id = profile['id']?.toString() ?? '';
                  final isFriend = acceptedFriendIds.contains(id);
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
                          CircleAvatar(child: Text((profile['username']?.toString() ?? 'O').characters.first.toUpperCase())),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(profile['username']?.toString() ?? 'Oyuncu', style: theme.textTheme.titleMedium),
                                Text('${profile['league_tier'] ?? 'bronze'} · ${profile['score'] ?? 0} XP'),
                              ],
                            ),
                          ),
                          if (isFriend)
                            FilledButton.tonal(
                              onPressed: () => _sendDuelInvite(id),
                              child: const Text('Düello'),
                            ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 20),
                Text('Düello davetleri', style: theme.textTheme.titleLarge),
                const SizedBox(height: 12),
                if (invites.isEmpty)
                  const Text('Aktif düello daveti yok.')
                else
                  ...invites.map((invite) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(22),
                            color: theme.colorScheme.surfaceContainerHighest,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('From: ${invite['from_user_id']}'),
                              Text('To: ${invite['to_user_id']}'),
                              Text('Status: ${invite['status']}'),
                            ],
                          ),
                        ),
                      )),
              ],
            ),
          );
        },
      ),
    );
  }
}
