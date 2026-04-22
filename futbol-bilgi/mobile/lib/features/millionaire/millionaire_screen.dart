import 'package:flutter/material.dart';
import 'millionaire_repository.dart';

class MillionaireScreen extends StatefulWidget {
  const MillionaireScreen({super.key});

  @override
  State<MillionaireScreen> createState() => _MillionaireScreenState();
}

class _MillionaireScreenState extends State<MillionaireScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _payload;

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await millionaireRepository.startGame();
      setState(() => _payload = data);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(child: Text('Millionaire başlatılamadı: $_error'));
    }

    final questions = (_payload?['questions'] as List<dynamic>? ?? []);
    final sessionId = _payload?['sessionId']?.toString() ?? '-';

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Millionaire hazır', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 12),
        Text('Session: $sessionId'),
        Text('Soru sayısı: ${questions.length}'),
        const SizedBox(height: 16),
        if (questions.isNotEmpty) ...[
          Text('İlk soru:', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text((questions.first as Map<String, dynamic>)['question_text']?.toString() ?? '-'),
        ],
      ],
    );
  }
}
