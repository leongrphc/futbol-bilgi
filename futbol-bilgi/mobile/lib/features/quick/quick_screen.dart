import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../profile/profile_provider.dart';
import 'quick_repository.dart';

class QuickScreen extends ConsumerStatefulWidget {
  const QuickScreen({super.key});

  @override
  ConsumerState<QuickScreen> createState() => _QuickScreenState();
}

class _QuickScreenState extends ConsumerState<QuickScreen> {
  static const int _totalQuestions = 10;
  static const int _totalTime = 120;
  static const int _pointsPerCorrect = 100;
  static const int _timeBonusMultiplier = 2;

  Timer? _timer;
  bool _isLoading = true;
  bool _isFinalizing = false;
  String? _error;
  String? _sessionId;
  List<Map<String, dynamic>> _questions = const [];
  int _questionIndex = 0;
  int _score = 0;
  int _correctAnswers = 0;
  int _totalAnswered = 0;
  int _timeRemaining = _totalTime;
  String? _selectedAnswer;
  String? _revealedAnswer;
  _QuickResult? _result;

  Map<String, dynamic>? get _currentQuestion {
    if (_questionIndex < 0 || _questionIndex >= _questions.length) {
      return null;
    }
    return _questions[_questionIndex];
  }

  List<_OptionItem> get _options {
    final raw = (_currentQuestion?['options'] as List<dynamic>? ?? []);
    return raw
        .map((option) => Map<String, dynamic>.from(option as Map))
        .map((option) => _OptionItem(
              key: option['key']?.toString() ?? '-',
              text: option['text']?.toString() ?? '-',
            ))
        .toList();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initializeGame());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _initializeGame() async {
    _timer?.cancel();
    setState(() {
      _isLoading = true;
      _isFinalizing = false;
      _error = null;
      _result = null;
      _sessionId = null;
      _questions = const [];
      _questionIndex = 0;
      _score = 0;
      _correctAnswers = 0;
      _totalAnswered = 0;
      _timeRemaining = _totalTime;
      _selectedAnswer = null;
      _revealedAnswer = null;
    });

    try {
      final data = await quickRepository.startGame();
      final questions = (data['questions'] as List<dynamic>? ?? [])
          .map((question) => Map<String, dynamic>.from(question as Map))
          .toList();
      final sessionId = data['sessionId']?.toString();

      if (questions.length < _totalQuestions || sessionId == null || sessionId.isEmpty) {
        throw Exception('Quick Play için yeterli veri gelmedi.');
      }

      setState(() {
        _questions = questions;
        _sessionId = sessionId;
        _isLoading = false;
      });

      _startTimer();
    } catch (error) {
      setState(() {
        _error = _humanizeError(error);
        _isLoading = false;
      });
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _isFinalizing || _result != null || _selectedAnswer != null) {
        return;
      }

      if (_timeRemaining <= 1) {
        timer.cancel();
        _finalizeGame(result: 'timeout');
        return;
      }

      setState(() => _timeRemaining -= 1);
    });
  }

  Future<void> _handleAnswerTap(String key) async {
    if (_selectedAnswer != null || _isFinalizing || _result != null) {
      return;
    }

    final question = _currentQuestion;
    if (question == null) {
      return;
    }

    final correctAnswer = question['correct_answer']?.toString();
    final isCorrect = key == correctAnswer;

    _timer?.cancel();
    setState(() {
      _selectedAnswer = key;
      _revealedAnswer = correctAnswer;
      _totalAnswered += 1;
      if (isCorrect) {
        _correctAnswers += 1;
        _score += _pointsPerCorrect;
      }
    });

    await Future<void>.delayed(const Duration(milliseconds: 950));

    if (!mounted) {
      return;
    }

    if (_questionIndex == _totalQuestions - 1) {
      await _finalizeGame(result: 'win');
      return;
    }

    setState(() {
      _questionIndex += 1;
      _selectedAnswer = null;
      _revealedAnswer = null;
    });
    _startTimer();
  }

  Future<void> _finalizeGame({required String result}) async {
    if (_isFinalizing || _sessionId == null) {
      return;
    }

    final timeBonus = _timeRemaining * _timeBonusMultiplier;
    final finalScore = _score + (result == 'win' ? timeBonus : 0);

    _timer?.cancel();
    setState(() => _isFinalizing = true);

    try {
      final data = await quickRepository.finishGame(
        sessionId: _sessionId!,
        result: result,
        score: finalScore,
        correctAnswers: _correctAnswers,
        totalAnswered: _totalAnswered,
      );

      final rewards = Map<String, dynamic>.from(data['rewards'] as Map? ?? <String, dynamic>{});
      setState(() {
        _result = _QuickResult(
          result: result,
          score: finalScore,
          correctAnswers: _correctAnswers,
          totalAnswered: _totalAnswered,
          questionReached: _questionIndex + 1,
          xpEarned: _asInt(rewards['xp']),
          profile: Map<String, dynamic>.from(data['profile'] as Map? ?? <String, dynamic>{}),
        );
      });
      ref.invalidate(profileProvider);
    } catch (error) {
      setState(() => _error = _humanizeError(error));
    } finally {
      if (mounted) {
        setState(() => _isFinalizing = false);
      }
    }
  }

  int _asInt(Object? value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  String _humanizeError(Object error) {
    final text = error.toString();
    if (text.contains('Unauthorized')) return 'Oturum geçersiz. Lütfen tekrar giriş yap.';
    return text.replaceFirst('Exception: ', '');
  }

  String _formatCompact(int value) {
    if (value >= 1000000) {
      final compact = value / 1000000;
      return compact % 1 == 0 ? '${compact.toInt()}M' : '${compact.toStringAsFixed(1)}M';
    }
    if (value >= 1000) {
      final compact = value / 1000;
      return compact % 1 == 0 ? '${compact.toInt()}K' : '${compact.toStringAsFixed(1)}K';
    }
    return '$value';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_error != null && _result == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Quick Play')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error!, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(onPressed: _initializeGame, child: const Text('Tekrar dene')),
              ],
            ),
          ),
        ),
      );
    }

    if (_result != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Quick Play Özeti')),
        body: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.primaryContainer,
                    theme.colorScheme.secondaryContainer,
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_result!.headline, style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text('Skor: ${_formatCompact(_result!.score)} · XP: +${_result!.xpEarned}'),
                ],
              ),
            ),
            const SizedBox(height: 20),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.25,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _ResultStat(label: 'Doğru', value: '${_result!.correctAnswers}/${_result!.totalAnswered}', icon: Icons.track_changes_rounded),
                _ResultStat(label: 'Soru', value: '${_result!.questionReached}/$_totalQuestions', icon: Icons.flag_rounded),
                _ResultStat(label: 'XP', value: '+${_result!.xpEarned}', icon: Icons.auto_awesome_rounded),
                _ResultStat(label: 'Level', value: '${_asInt(_result!.profile['level'])}', icon: Icons.military_tech_rounded),
              ],
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _initializeGame,
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
              icon: const Icon(Icons.replay_rounded),
              label: const Text('Tekrar Oyna'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => context.go('/'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(54)),
              icon: const Icon(Icons.home_rounded),
              label: const Text('Ana Sayfaya Dön'),
            ),
          ],
        ),
      );
    }

    final question = _currentQuestion;
    if (question == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Quick Play')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                Expanded(child: _TopMetricCard(label: 'Soru', value: '${_questionIndex + 1}/$_totalQuestions', icon: Icons.help_outline_rounded)),
                const SizedBox(width: 12),
                Expanded(child: _TopMetricCard(label: 'Süre', value: '$_timeRemaining sn', icon: Icons.timer_outlined, accent: _timeRemaining <= 10 ? theme.colorScheme.error : null)),
                const SizedBox(width: 12),
                Expanded(child: _TopMetricCard(label: 'Skor', value: _formatCompact(_score), icon: Icons.bolt_rounded)),
              ],
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: (_timeRemaining / _totalTime).clamp(0, 1),
              minHeight: 10,
              borderRadius: BorderRadius.circular(999),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                color: theme.colorScheme.surfaceContainerHighest,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Quick Play', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(question['question_text']?.toString() ?? '-', style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text('Her doğru cevap +100 puan, kalan süre bonus olarak eklenir.'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            ..._options.map(
              (option) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _AnswerButton(
                  option: option,
                  isDisabled: _selectedAnswer != null || _isFinalizing,
                  isSelected: _selectedAnswer == option.key,
                  isCorrect: _revealedAnswer == option.key && question['correct_answer']?.toString() == option.key,
                  isWrong: _revealedAnswer != null && _selectedAnswer == option.key && question['correct_answer']?.toString() != option.key,
                  onTap: () => _handleAnswerTap(option.key),
                ),
              ),
            ),
            if (_isFinalizing) ...[
              const SizedBox(height: 20),
              const Center(child: CircularProgressIndicator()),
            ],
          ],
        ),
      ),
    );
  }
}

class _OptionItem {
  const _OptionItem({required this.key, required this.text});

  final String key;
  final String text;
}

class _QuickResult {
  const _QuickResult({
    required this.result,
    required this.score,
    required this.correctAnswers,
    required this.totalAnswered,
    required this.questionReached,
    required this.xpEarned,
    required this.profile,
  });

  final String result;
  final int score;
  final int correctAnswers;
  final int totalAnswered;
  final int questionReached;
  final int xpEarned;
  final Map<String, dynamic> profile;

  String get headline => result == 'timeout' ? 'Süre doldu.' : 'Quick Play tamamlandı.';
}

class _TopMetricCard extends StatelessWidget {
  const _TopMetricCard({required this.label, required this.value, required this.icon, this.accent});

  final String label;
  final String value;
  final IconData icon;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = accent ?? theme.colorScheme.primary;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: theme.colorScheme.surfaceContainer,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(height: 10),
          Text(label, style: theme.textTheme.labelLarge),
          const SizedBox(height: 4),
          Text(value, style: theme.textTheme.titleMedium),
        ],
      ),
    );
  }
}

class _AnswerButton extends StatelessWidget {
  const _AnswerButton({
    required this.option,
    required this.onTap,
    required this.isDisabled,
    required this.isSelected,
    required this.isCorrect,
    required this.isWrong,
  });

  final _OptionItem option;
  final VoidCallback onTap;
  final bool isDisabled;
  final bool isSelected;
  final bool isCorrect;
  final bool isWrong;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Color background = theme.colorScheme.surfaceContainerHighest;
    Color foreground = theme.colorScheme.onSurface;

    if (isCorrect) {
      background = theme.colorScheme.primaryContainer;
      foreground = theme.colorScheme.onPrimaryContainer;
    } else if (isWrong) {
      background = theme.colorScheme.errorContainer;
      foreground = theme.colorScheme.onErrorContainer;
    } else if (isSelected) {
      background = theme.colorScheme.secondaryContainer;
      foreground = theme.colorScheme.onSecondaryContainer;
    }

    return SizedBox(
      width: double.infinity,
      child: FilledButton(
        onPressed: isDisabled ? null : onTap,
        style: FilledButton.styleFrom(
          backgroundColor: background,
          foregroundColor: foreground,
          disabledBackgroundColor: background,
          disabledForegroundColor: foreground,
          minimumSize: const Size.fromHeight(58),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          alignment: Alignment.centerLeft,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: foreground.withValues(alpha: 0.12),
              child: Text(option.key, style: Theme.of(context).textTheme.labelLarge),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(option.text)),
          ],
        ),
      ),
    );
  }
}

class _ResultStat extends StatelessWidget {
  const _ResultStat({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        color: theme.colorScheme.surfaceContainerHighest,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon),
          const Spacer(),
          Text(value, style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(label, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}
