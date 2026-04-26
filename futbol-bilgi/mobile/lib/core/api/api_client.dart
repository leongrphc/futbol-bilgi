import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../supabase/supabase_provider.dart';

class ApiClient {
  ApiClient()
      : _dio = Dio(
          BaseOptions(
            baseUrl: AppConfig.apiBaseUrl,
            connectTimeout: const Duration(seconds: 6),
            sendTimeout: const Duration(seconds: 6),
            receiveTimeout: const Duration(seconds: 8),
          ),
        );

  final Dio _dio;

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.get(
        path,
        queryParameters: queryParameters,
        options: await _authorizedOptions(),
      );
    } on DioException catch (error) {
      throw Exception(_messageFor(error));
    }
  }

  Future<Response<dynamic>> post(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: await _authorizedOptions(),
      );
    } on DioException catch (error) {
      throw Exception(_messageFor(error));
    }
  }

  Future<Response<dynamic>> patch(String path, {Object? data}) async {
    try {
      return await _dio.patch(
        path,
        data: data,
        options: await _authorizedOptions(),
      );
    } on DioException catch (error) {
      throw Exception(_messageFor(error));
    }
  }

  Future<Options> _authorizedOptions() async {
    final token = supabaseClient.auth.currentSession?.accessToken;
    return Options(
      headers: {
        if (token != null) 'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
  }

  String _messageFor(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Sunucu zamanında yanıt vermedi. Bağlantını kontrol edip tekrar dene.';
      case DioExceptionType.connectionError:
        return 'Sunucuya ulaşılamadı. API bağlantısını ve ağ ayarlarını kontrol et.';
      case DioExceptionType.badResponse:
        final data = error.response?.data;
        if (data is Map && data['error'] != null) {
          return data['error'].toString();
        }
        return 'Sunucu isteği tamamlayamadı.';
      case DioExceptionType.cancel:
        return 'İstek iptal edildi.';
      case DioExceptionType.badCertificate:
        return 'Sunucu sertifikası doğrulanamadı.';
      case DioExceptionType.unknown:
        final message = error.message?.trim();
        if (message != null && message.isNotEmpty) {
          return message;
        }
        return 'Beklenmeyen bir bağlantı hatası oluştu.';
    }
  }
}

final apiClient = ApiClient();
