import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/analytics/analytics_service.dart';
import '../../core/share/share_service.dart';
import '../profile/profile_provider.dart';
import 'duel_repository.dart';

class DuelScreen extends ConsumerStatefulWidget {
  const DuelScreen({super.key});

  @override
  ConsumerState<DuelScreen> createState() => _DuelScreenState();
}

class _DuelScreenState extends ConsumerState<DuelScreen> {
  static const int _totalQuestions = 5;
  static const int _timePerQuestion = 15;

  final Random _random = Random();
  Timer? _timer;
  bool _isLoading = true;
  bool _isFinalizing = false;
  String? _error;
  String? _sessionId;
  List<Map<String, dynamic>> _questions = const [];
  int _questionIndex = 0;
  int _timeRemaining = _timePerQuestion;
  int _playerScore = 0;
  int _opponentScore = 0;
  int _correctAnswers = 0;
  int _totalAnswered = 0;
  int _totalAnswerTimeMs = 0;
  String? _selectedAnswer;
  String? _revealedAnswer;
  _DuelResult? _result;
  _MockOpponent? _opponent;

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
        .map(
          (option) => _OptionItem(
            key: option['key']?.toString() ?? '-',
            text: option['text']?.toString() ?? '-',
          ),
        )
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
      _sessionId = null;
      _questions = const [];
      _questionIndex = 0;
      _timeRemaining = _timePerQuestion;
      _playerScore = 0;
      _opponentScore = 0;
      _correctAnswers = 0;
      _totalAnswered = 0;
      _totalAnswerTimeMs = 0;
      _selectedAnswer = null;
      _revealedAnswer = null;
      _result = null;
      _opponent = null;
    });

    try {
      final data = await duelRepository.startGame();
      final questions = (data['questions'] as List<dynamic>? ?? [])
          .map((question) => Map<String, dynamic>.from(question as Map))
          .toList();
      final sessionId = data['sessionId']?.toString();

      if (questions.length < _totalQuestions ||
          sessionId == null ||
          sessionId.isEmpty) {
        throw Exception('Düello için yeterli veri gelmedi.');
      }

      setState(() {
        _questions = questions;
        _sessionId = sessionId;
        _opponent = _MockOpponent(
          username: 'Rakip${100 + _random.nextInt(900)}',
          elo: 900 + _random.nextInt(400),
        );
        _isLoading = false;
      });
      analyticsService.track('game_started', {'mode': 'duel'});

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
      if (!mounted ||
          _isFinalizing ||
          _selectedAnswer != null ||
          _result != null) {
        return;
      }

      if (_timeRemaining <= 1) {
        timer.cancel();
        _answer(null, timedOut: true);
        return;
      }

      setState(() => _timeRemaining -= 1);
    });
  }

  Future<void> _answer(String? answer, {bool timedOut = false}) async {
    if (_selectedAnswer != null || _isFinalizing || _result != null) {
      return;
    }

    final question = _currentQuestion;
    if (question == null) {
      return;
    }

    final correct = question['correct_answer']?.toString();
    final isCorrect = answer == correct;
    final answerTimeMs = (_timePerQuestion - _timeRemaining) * 1000;
    final opponentCorrect = _random.nextDouble() > 0.35;
    final opponentScoreGain = opponentCorrect ? 100 + _random.nextInt(51) : 0;
    final playerScoreGain = isCorrect ? 100 + (_timeRemaining * 3) : 0;

    _timer?.cancel();
    setState(() {
      _selectedAnswer = answer ?? 'TIMEOUT';
      _revealedAnswer = correct;
      _totalAnswered += 1;
      _totalAnswerTimeMs += answerTimeMs;
      if (isCorrect) {
        _correctAnswers += 1;
      }
      _playerScore += playerScoreGain;
      _opponentScore += opponentScoreGain;
    });

    await Future<void>.delayed(const Duration(milliseconds: 1100));

    if (!mounted) {
      return;
    }

    if (_questionIndex == _totalQuestions - 1) {
      await _finish();
      return;
    }

    setState(() {
      _questionIndex += 1;
      _timeRemaining = _timePerQuestion;
      _selectedAnswer = null;
      _revealedAnswer = null;
    });
    _startTimer();
  }

  Future<void> _finish() async {
    if (_isFinalizing || _sessionId == null || _opponent == null) {
      return;
    }

    final result = _playerScore > _opponentScore
        ? 'win'
        : _playerScore < _opponentScore
        ? 'loss'
        : 'draw';

    setState(() => _isFinalizing = true);

    try {
      final data = await duelRepository.finishGame(
        sessionId: _sessionId!,
        result: result,
        score: _playerScore,
        correctAnswers: _correctAnswers,
        totalAnswered: _totalAnswered,
        opponentElo: _opponent!.elo,
        answerTimeMs: _totalAnswerTimeMs,
      );

      final rewards = Map<String, dynamic>.from(
        data['rewards'] as Map? ?? <String, dynamic>{},
      );
      analyticsService.track('game_completed', {
        'mode': 'duel',
        'result': result,
        'score': _playerScore,
        'correct_answers': _correctAnswers,
        'total_answered': _totalAnswered,
      });
      setState(() {
        _result = _DuelResult(
          result: (data['duelResult']?.toString() ?? result),
          playerScore: _playerScore,
          opponentScore: _opponentScore,
          correctAnswers: _correctAnswers,
          totalAnswered: _totalAnswered,
          xpEarned: _asInt(rewards['xp']),
          coinsEarned: _asInt(rewards['coins']),
          eloDelta: _asInt(rewards['eloDelta']),
          profile: Map<String, dynamic>.from(
            data['profile'] as Map? ?? <String, dynamic>{},
          ),
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
    if (text.contains('Insufficient energy')) {
      return 'Düello için yeterli enerji yok.';
    }
    if (text.contains('Unauthorized')) {
      return 'Oturum geçersiz. Lütfen tekrar giriş yap.';
    }
    return text.replaceFirst('Exception: ', '');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_error != null && _result == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Düello')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(_error!, textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _initializeGame,
                  child: const Text('Tekrar dene'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_result != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Düello Özeti')),
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
                    theme.colorScheme.tertiaryContainer,
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_result!.headline, style: theme.textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text(
                    'Sen ${_result!.playerScore} · Rakip ${_result!.opponentScore} · ELO ${_result!.eloDelta >= 0 ? '+' : ''}${_result!.eloDelta}',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            GridView.count(
              shrinkWrap: true,
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.15,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _ResultStat(
                  label: 'Doğru',
                  value: '${_result!.correctAnswers}/${_result!.totalAnswered}',
                  icon: Icons.track_changes_rounded,
                ),
                _ResultStat(
                  label: 'XP',
                  value: '+${_result!.xpEarned}',
                  icon: Icons.auto_awesome_rounded,
                ),
                _ResultStat(
                  label: 'Coin',
                  value: '+${_result!.coinsEarned}',
                  icon: Icons.monetization_on_rounded,
                ),
                _ResultStat(
                  label: 'Level',
                  value: '${_asInt(_result!.profile['level'])}',
                  icon: Icons.military_tech_rounded,
                ),
              ],
            ),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: _initializeGame,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
              ),
              icon: const Icon(Icons.replay_rounded),
              label: const Text('Tekrar Oyna'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => shareService.shareGameResult(
                mode: 'Düello',
                score: _result!.playerScore,
                correctAnswers: _result!.correctAnswers,
                totalAnswered: _result!.totalAnswered,
              ),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
              ),
              icon: const Icon(Icons.share_rounded),
              label: const Text('Sonucu Paylaş'),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => context.go('/'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(54),
              ),
              icon: const Icon(Icons.home_rounded),
              label: const Text('Ana Sayfaya Dön'),
            ),
          ],
        ),
      );
    }

    final question = _currentQuestion;
    if (question == null || _opponent == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Düello')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                color: theme.colorScheme.surfaceContainerHighest,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Sen', style: theme.textTheme.labelLarge),
                        const SizedBox(height: 4),
                        Text(
                          '$_playerScore',
                          style: theme.textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      const Icon(Icons.sports_martial_arts_rounded),
                      const SizedBox(height: 6),
                      Text('${_questionIndex + 1}/$_totalQuestions'),
                    ],
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _opponent!.username,
                          style: theme.textTheme.labelLarge,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$_opponentScore',
                          style: theme.textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            LinearProgressIndicator(
              value: (_timeRemaining / _timePerQuestion).clamp(0, 1),
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
                  Text('Düello Sorusu', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    question['question_text']?.toString() ?? '-',
                    style: theme.textTheme.headlineSmall,
                  ),
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
                  isCorrect:
                      _revealedAnswer == option.key &&
                      question['correct_answer']?.toString() == option.key,
                  isWrong:
                      _revealedAnswer != null &&
                      _selectedAnswer == option.key &&
                      question['correct_answer']?.toString() != option.key,
                  onTap: () => _answer(option.key),
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

class _MockOpponent {
  const _MockOpponent({required this.username, required this.elo});

  final String username;
  final int elo;
}

class _OptionItem {
  const _OptionItem({required this.key, required this.text});

  final String key;
  final String text;
}

class _DuelResult {
  const _DuelResult({
    required this.result,
    required this.playerScore,
    required this.opponentScore,
    required this.correctAnswers,
    required this.totalAnswered,
    required this.xpEarned,
    required this.coinsEarned,
    required this.eloDelta,
    required this.profile,
  });

  final String result;
  final int playerScore;
  final int opponentScore;
  final int correctAnswers;
  final int totalAnswered;
  final int xpEarned;
  final int coinsEarned;
  final int eloDelta;
  final Map<String, dynamic> profile;

  String get headline {
    switch (result) {
      case 'win':
        return 'Düelloyu kazandın!';
      case 'loss':
        return 'Düello kaybedildi.';
      default:
        return 'Düello berabere bitti.';
    }
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
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: foreground.withValues(alpha: 0.12),
              child: Text(
                option.key,
                style: Theme.of(context).textTheme.labelLarge,
              ),
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
  const _ResultStat({
    required this.label,
    required this.value,
    required this.icon,
  });

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
