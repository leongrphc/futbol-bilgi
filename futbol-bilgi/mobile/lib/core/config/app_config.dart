import 'package:flutter/foundation.dart';

class AppConfig {
  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://YOUR_SUPABASE_URL.supabase.co',
  );

  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'YOUR_SUPABASE_ANON_KEY',
  );

  static String get apiBaseUrl {
    const configuredBaseUrl = String.fromEnvironment('API_BASE_URL');
    if (configuredBaseUrl.isNotEmpty) {
      return configuredBaseUrl;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:3000';
      default:
        return 'http://127.0.0.1:3000';
    }
  }

  static bool get isSupabaseConfigured {
    return !supabaseUrl.contains('YOUR_SUPABASE_URL') && !supabaseAnonKey.contains('YOUR_SUPABASE_ANON_KEY');
  }

  static List<String> get missingConfiguration {
    return [
      if (supabaseUrl.contains('YOUR_SUPABASE_URL')) 'SUPABASE_URL',
      if (supabaseAnonKey.contains('YOUR_SUPABASE_ANON_KEY')) 'SUPABASE_ANON_KEY',
    ];
  }

  static bool get isLocalApiBaseUrl {
    return apiBaseUrl.contains('localhost') || apiBaseUrl.contains('127.0.0.1') || apiBaseUrl.contains('10.0.2.2');
  }
}
