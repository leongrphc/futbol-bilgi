import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/supabase/supabase_provider.dart';
import 'profile_repository.dart';

const _profileLoadTimeout = Duration(seconds: 10);

final profileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final session = await ref.watch(authSessionProvider.future).timeout(
    _profileLoadTimeout,
    onTimeout: () => throw Exception(
      'Oturum bilgisi zamanında alınamadı. Uygulamayı yeniden deneyin.',
    ),
  );
  if (session == null) {
    return null;
  }

  return profileRepository.fetchProfile().timeout(
    _profileLoadTimeout,
    onTimeout: () => throw Exception(
      'Profil verisi zamanında alınamadı. Bağlantını kontrol edip tekrar dene.',
    ),
  );
});
