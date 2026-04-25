import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

enum AppProgressTone { primary, gold, success, danger, warning, info }

class AppProgressBar extends StatelessWidget {
  const AppProgressBar({
    super.key,
    required this.value,
    this.height = 10,
    this.tone = AppProgressTone.primary,
  });

  final double value;
  final double height;
  final AppProgressTone tone;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.of(context);
    final color = switch (tone) {
      AppProgressTone.gold => palette.gold,
      AppProgressTone.success => palette.success,
      AppProgressTone.danger => palette.danger,
      AppProgressTone.warning => palette.warning,
      AppProgressTone.info => palette.info,
      AppProgressTone.primary => palette.primaryBright,
    };
    final clamped = value.clamp(0.0, 1.0);

    return ClipRRect(
      borderRadius: BorderRadius.circular(999),
      child: Container(
        height: height,
        color: Colors.white.withValues(alpha: 0.08),
        alignment: Alignment.centerLeft,
        child: FractionallySizedBox(
          widthFactor: clamped,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, Color.lerp(color, Colors.white, 0.22)!],
              ),
              boxShadow: [
                BoxShadow(color: color.withValues(alpha: 0.35), blurRadius: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
