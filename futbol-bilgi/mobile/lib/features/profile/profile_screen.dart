import 'package:flutter/material.dart';
import 'profile_repository.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>?>(
      future: profileRepository.fetchProfile(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(child: Text('Profil alınamadı: ${snapshot.error}'));
        }

        final profile = snapshot.data;
        if (profile == null) {
          return const Center(child: Text('Profil bulunamadı.'));
        }

        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(profile['username']?.toString() ?? 'Oyuncu', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 12),
            Text('Level: ${profile['level'] ?? '-'}'),
            Text('XP: ${profile['xp'] ?? '-'}'),
            Text('Coins: ${profile['coins'] ?? '-'}'),
            Text('Energy: ${profile['energy'] ?? '-'}'),
          ],
        );
      },
    );
  }
}
