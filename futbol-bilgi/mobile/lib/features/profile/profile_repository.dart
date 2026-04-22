import '../../core/api/api_client.dart';

class ProfileRepository {
  Future<Map<String, dynamic>?> fetchProfile() async {
    final response = await apiClient.get('/api/me');
    return response.data['data'] as Map<String, dynamic>?;
  }
}

final profileRepository = ProfileRepository();
