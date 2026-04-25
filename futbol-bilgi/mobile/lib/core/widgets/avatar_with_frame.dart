import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class AvatarWithFrame extends StatelessWidget {
  const AvatarWithFrame({
    super.key,
    required this.child,
    this.frameKey,
    this.padding = const EdgeInsets.all(4),
  });

  final Widget child;
  final String? frameKey;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final palette = AppTheme.of(context);
    final style = _AvatarFrameStyle.from(frameKey, palette);

    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: style.gradient,
        color: style.backgroundColor,
        boxShadow: style.boxShadows,
        border: style.border,
      ),
      child: Padding(
        padding: padding,
        child: child,
      ),
    );
  }
}

class _AvatarFrameStyle {
  const _AvatarFrameStyle({
    required this.gradient,
    required this.backgroundColor,
    required this.boxShadows,
    required this.border,
  });

  final Gradient? gradient;
  final Color? backgroundColor;
  final List<BoxShadow> boxShadows;
  final BoxBorder? border;

  static String _normalizeFrameKey(String? frameKey) {
    final normalized = (frameKey ?? '').trim().toLowerCase();
    switch (normalized) {
      case 'bronze':
      case 'bronz':
      case 'bronz çerçeve':
      case 'bronz cerceve':
      case 'classic':
      case 'klasik çerçeve':
      case 'klasik cerceve':
        return 'default';
      case 'gümüş':
      case 'gumus':
      case 'gümüş çerçeve':
      case 'gumus cerceve':
        return 'silver';
      case 'altın':
      case 'altin':
      case 'altın çerçeve':
      case 'altin cerceve':
        return 'gold';
      case 'elmas':
      case 'elmas çerçeve':
      case 'elmas cerceve':
        return 'diamond';
      case 'şampiyon':
      case 'sampiyon':
      case 'şampiyon çerçeve':
      case 'sampiyon cerceve':
        return 'champion';
      default:
        return normalized;
    }
  }

  static _AvatarFrameStyle from(String? frameKey, AppThemePalette palette) {
    switch (_normalizeFrameKey(frameKey)) {
      case 'silver':
      case 'gümüş çerçeve':
      case 'gumus cerceve':
        return _AvatarFrameStyle(
          gradient: const LinearGradient(
            colors: [Color(0xFFF8FAFC), Color(0xFF94A3B8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          backgroundColor: null,
          boxShadows: [
            BoxShadow(
              color: const Color(0xFFE2E8F0).withValues(alpha: 0.26),
              blurRadius: 18,
              spreadRadius: 2,
            ),
          ],
          border: Border.all(color: Colors.white.withValues(alpha: 0.32), width: 2.5),
        );
      case 'gold':
      case 'altın çerçeve':
      case 'altin cerceve':
        return _AvatarFrameStyle(
          gradient: const LinearGradient(
            colors: [Color(0xFFFFF3B0), Color(0xFFF59E0B), Color(0xFFB45309)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          backgroundColor: null,
          boxShadows: [
            BoxShadow(
              color: const Color(0xFFFBBF24).withValues(alpha: 0.34),
              blurRadius: 20,
              spreadRadius: 3,
            ),
          ],
          border: Border.all(color: const Color(0xFFFFFBEB).withValues(alpha: 0.56), width: 2.5),
        );
      case 'diamond':
      case 'elmas çerçeve':
      case 'elmas cerceve':
        return _AvatarFrameStyle(
          gradient: const LinearGradient(
            colors: [Color(0xFFE0F2FE), Color(0xFF38BDF8), Color(0xFF6366F1)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          backgroundColor: null,
          boxShadows: [
            BoxShadow(
              color: const Color(0xFF38BDF8).withValues(alpha: 0.34),
              blurRadius: 22,
              spreadRadius: 3,
            ),
          ],
          border: Border.all(color: Colors.white.withValues(alpha: 0.34), width: 2.5),
        );
      case 'champion':
      case 'şampiyon çerçeve':
      case 'sampiyon cerceve':
        return _AvatarFrameStyle(
          gradient: const SweepGradient(
            colors: [
              Color(0xFFF5D0FE),
              Color(0xFFE879F9),
              Color(0xFF8B5CF6),
              Color(0xFFF59E0B),
              Color(0xFFF5D0FE),
            ],
          ),
          backgroundColor: null,
          boxShadows: [
            BoxShadow(
              color: const Color(0xFFA855F7).withValues(alpha: 0.38),
              blurRadius: 24,
              spreadRadius: 4,
            ),
          ],
          border: Border.all(color: Colors.white.withValues(alpha: 0.34), width: 3),
        );
      case 'default':
      case 'bronz çerçeve':
      case 'bronz cerceve':
      case '':
        return _AvatarFrameStyle(
          gradient: null,
          backgroundColor: palette.elevated,
          boxShadows: [
            BoxShadow(
              color: palette.primary.withValues(alpha: 0.16),
              blurRadius: 12,
              spreadRadius: 1,
            ),
          ],
          border: Border.all(
            color: palette.primary.withValues(alpha: 0.24),
            width: 1.5,
          ),
        );
      default:
        return _AvatarFrameStyle(
          gradient: null,
          backgroundColor: palette.elevated,
          boxShadows: [
            BoxShadow(
              color: palette.primary.withValues(alpha: 0.16),
              blurRadius: 12,
              spreadRadius: 1,
            ),
          ],
          border: Border.all(
            color: palette.primary.withValues(alpha: 0.24),
            width: 1.5,
          ),
        );
    }
  }
}
