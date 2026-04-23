import '../../core/api/api_client.dart';

class ShopRepository {
  Future<Map<String, dynamic>> fetchThemes() async {
    final response = await apiClient.get('/api/shop/themes');
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> buyTheme(String itemId) async {
    final response = await apiClient.post('/api/shop/themes', data: {
      'itemId': itemId,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> equipTheme(String itemId) async {
    final response = await apiClient.patch('/api/shop/themes', data: {
      'itemId': itemId,
    });
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> buyUtility(String itemKey) async {
    final response = await apiClient.post('/api/shop/purchase', data: {
      'itemKey': itemKey,
    });
    return response.data['data'] as Map<String, dynamic>;
  }
}

final shopRepository = ShopRepository();
