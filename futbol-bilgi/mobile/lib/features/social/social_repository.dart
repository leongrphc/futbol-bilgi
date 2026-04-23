import '../../core/api/api_client.dart';

class SocialRepository {
  Future<Map<String, dynamic>> fetchSnapshot() async {
    final response = await apiClient.get('/api/social');
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> sendFriendRequest(String username) async {
    final response = await apiClient.post('/api/social/friendships', data: {
      'username': username,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> acceptFriendRequest(String requesterId) async {
    final response = await apiClient.patch('/api/social/friendships', data: {
      'action': 'accept',
      'requesterId': requesterId,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> rejectFriendRequest(String requesterId) async {
    final response = await apiClient.patch('/api/social/friendships', data: {
      'action': 'reject',
      'requesterId': requesterId,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> sendDuelInvite(String toUserId) async {
    final response = await apiClient.post('/api/social/duel-invites', data: {
      'toUserId': toUserId,
    });
    return response.data['data'] as Map<String, dynamic>;
  }
}

final socialRepository = SocialRepository();
