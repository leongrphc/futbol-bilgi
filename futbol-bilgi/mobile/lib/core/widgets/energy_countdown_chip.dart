import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class EnergyCountdownChip extends StatefulWidget {
  const EnergyCountdownChip({
    super.key,
    required this.energy,
    required this.maxEnergy,
    required this.lastRefillTimestamp,
    this.color,
    this.compact = false,
  });

  final int energy;
  final int maxEnergy;
  final String? lastRefillTimestamp;
  final Color? color;
  final bool compact;

  @override
  State<EnergyCountdownChip> createState() => _EnergyCountdownChipState();
}

class _EnergyCountdownChipState extends State<EnergyCountdownChip> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void didUpdateWidget(covariant EnergyCountdownChip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.energy != widget.energy ||
        oldWidget.lastRefillTimestamp != widget.lastRefillTimestamp) {
      _startTimer();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    if (widget.energy >= widget.maxEnergy) {
      return;
    }
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.of(context);
    final resolvedColor = widget.color ?? palette.gold;
    final nextRefillIn = _nextRefillIn();
    final statusText = widget.energy >= widget.maxEnergy
        ? 'Dolu'
        : _formatDuration(nextRefillIn);

    return Container(
      constraints: BoxConstraints(minHeight: widget.compact ? 40 : 44),
      padding: EdgeInsets.symmetric(
        horizontal: widget.compact ? 12 : 13,
        vertical: widget.compact ? 8 : 10,
      ),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: resolvedColor.withValues(alpha: 0.13),
        border: Border.all(color: resolvedColor.withValues(alpha: 0.24)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.bolt_rounded, size: 18, color: resolvedColor),
          const SizedBox(width: 8),
          Text(
            'Enerji: ${widget.energy}/${widget.maxEnergy}',
            style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: palette.textPrimary,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            statusText,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: resolvedColor,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Duration _nextRefillIn() {
    if (widget.energy >= widget.maxEnergy) {
      return Duration.zero;
    }
    final lastRefill = DateTime.tryParse(widget.lastRefillTimestamp ?? '');
    final baseTime = lastRefill ?? DateTime.now();
    final nextRefill = baseTime.add(const Duration(minutes: 20));
    final difference = nextRefill.difference(DateTime.now());
    if (difference.isNegative) {
      return Duration.zero;
    }
    return difference;
  }

  String _formatDuration(Duration duration) {
    final totalSeconds = duration.inSeconds;
    final minutes = (totalSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (totalSeconds % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }
}
