import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppThemePalette {
  const AppThemePalette({
    required this.background,
    required this.backgroundSoft,
    required this.card,
    required this.elevated,
    required this.primary,
    required this.primaryBright,
    required this.gold,
    required this.goldSoft,
    required this.accent,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.success,
    required this.danger,
    required this.warning,
    required this.info,
    required this.expert,
  });

  final Color background;
  final Color backgroundSoft;
  final Color card;
  final Color elevated;
  final Color primary;
  final Color primaryBright;
  final Color gold;
  final Color goldSoft;
  final Color accent;
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color success;
  final Color danger;
  final Color warning;
  final Color info;
  final Color expert;
}

class AppColors {
  static const background = Color(0xFF0D1117);
  static const backgroundSoft = Color(0xFF161B22);
  static const card = Color(0xFF1C2333);
  static const elevated = Color(0xFF242D3D);
  static const primary = Color(0xFF2E7D32);
  static const primaryBright = Color(0xFF3FB950);
  static const gold = Color(0xFFFFC107);
  static const goldSoft = Color(0xFFFFD54F);
  static const accent = Color(0xFFFF6D00);
  static const textPrimary = Color(0xFFE6EDF3);
  static const textSecondary = Color(0xFF8B949E);
  static const textMuted = Color(0xFF484F58);
  static const success = Color(0xFF2EA043);
  static const danger = Color(0xFFF85149);
  static const warning = Color(0xFFD29922);
  static const info = Color(0xFF58A6FF);
  static const expert = Color(0xFFBC4DFF);

  static const stadiumNight = AppThemePalette(
    background: Color(0xFF0D1117),
    backgroundSoft: Color(0xFF161B22),
    card: Color(0xFF1C2333),
    elevated: Color(0xFF242D3D),
    primary: Color(0xFF2E7D32),
    primaryBright: Color(0xFF3FB950),
    gold: Color(0xFFFFC107),
    goldSoft: Color(0xFFFFD54F),
    accent: Color(0xFFFF6D00),
    textPrimary: Color(0xFFE6EDF3),
    textSecondary: Color(0xFF8B949E),
    textMuted: Color(0xFF484F58),
    success: Color(0xFF2EA043),
    danger: Color(0xFFF85149),
    warning: Color(0xFFD29922),
    info: Color(0xFF58A6FF),
    expert: Color(0xFFBC4DFF),
  );

  static const oceanPulse = AppThemePalette(
    background: Color(0xFF07131D),
    backgroundSoft: Color(0xFF0D1D2A),
    card: Color(0xFF12283A),
    elevated: Color(0xFF19344B),
    primary: Color(0xFF0F766E),
    primaryBright: Color(0xFF22D3EE),
    gold: Color(0xFF7DD3FC),
    goldSoft: Color(0xFFBAE6FD),
    accent: Color(0xFF38BDF8),
    textPrimary: Color(0xFFE0F2FE),
    textSecondary: Color(0xFF94A3B8),
    textMuted: Color(0xFF64748B),
    success: Color(0xFF34D399),
    danger: Color(0xFFFB7185),
    warning: Color(0xFFFBBF24),
    info: Color(0xFF38BDF8),
    expert: Color(0xFFA78BFA),
  );

  static const sunsetFlare = AppThemePalette(
    background: Color(0xFF1A1020),
    backgroundSoft: Color(0xFF24142B),
    card: Color(0xFF311A38),
    elevated: Color(0xFF3D2347),
    primary: Color(0xFFBE185D),
    primaryBright: Color(0xFFF472B6),
    gold: Color(0xFFF59E0B),
    goldSoft: Color(0xFFFCD34D),
    accent: Color(0xFFFB7185),
    textPrimary: Color(0xFFFAE8FF),
    textSecondary: Color(0xFFC4B5FD),
    textMuted: Color(0xFF8B5CF6),
    success: Color(0xFF4ADE80),
    danger: Color(0xFFFB7185),
    warning: Color(0xFFF59E0B),
    info: Color(0xFF60A5FA),
    expert: Color(0xFFE879F9),
  );

  static AppThemePalette paletteFor(String? themeKey) {
    switch (_normalizeThemeKey(themeKey)) {
      case 'green-grass':
      case 'green_grass':
      case 'ocean':
      case 'ocean_pulse':
      case 'blue':
      case 'ice':
      case 'emerald-flare':
      case 'emerald_flare':
      case 'zümrüt alev':
      case 'zumrut alev':
      case 'yeşil çim':
      case 'yesil cim':
        return oceanPulse;
      case 'golden-cup':
      case 'golden_cup':
      case 'champion-night':
      case 'champion_night':
      case 'retro-pitch':
      case 'retro_pitch':
      case 'midnight-gold':
      case 'midnight_gold':
      case 'sunset':
      case 'sunset_flare':
      case 'pink':
      case 'rose':
      case 'lava':
      case 'şampiyonlar gecesi':
      case 'sampiyonlar gecesi':
      case 'gece altını':
      case 'gece altini':
      case 'altın kupa':
      case 'altin kupa':
      case 'retro saha':
        return sunsetFlare;
      default:
        return stadiumNight;
    }
  }

  static String _normalizeThemeKey(String? value) {
    return (value ?? '').trim().toLowerCase();
  }
}

class AppTheme {
  static ThemeData dark({String? themeKey}) {
    final palette = AppColors.paletteFor(themeKey);
    final base = FlexThemeData.dark(
      colors: FlexSchemeColor(
        primary: palette.primary,
        primaryContainer: Color.lerp(palette.primary, palette.background, 0.6)!,
        secondary: palette.gold,
        secondaryContainer: Color.lerp(palette.gold, palette.background, 0.72)!,
        tertiary: palette.accent,
        tertiaryContainer: Color.lerp(palette.accent, palette.background, 0.72)!,
        appBarColor: palette.background,
        error: palette.danger,
        errorContainer: Color.lerp(palette.danger, palette.background, 0.7)!,
      ),
      surfaceMode: FlexSurfaceMode.highScaffoldLowSurface,
      blendLevel: 12,
      appBarStyle: FlexAppBarStyle.background,
      useMaterial3: true,
      scaffoldBackground: palette.background,
    );

    final inter = GoogleFonts.interTextTheme(base.textTheme);
    final textTheme = inter.copyWith(
      displayLarge: GoogleFonts.outfit(
        textStyle: inter.displayLarge,
        color: palette.textPrimary,
        fontWeight: FontWeight.w800,
      ),
      displayMedium: GoogleFonts.outfit(
        textStyle: inter.displayMedium,
        color: palette.textPrimary,
        fontWeight: FontWeight.w800,
      ),
      headlineMedium: GoogleFonts.outfit(
        textStyle: inter.headlineMedium,
        color: palette.textPrimary,
        fontWeight: FontWeight.w800,
      ),
      headlineSmall: GoogleFonts.outfit(
        textStyle: inter.headlineSmall,
        color: palette.textPrimary,
        fontWeight: FontWeight.w800,
      ),
      titleLarge: GoogleFonts.outfit(
        textStyle: inter.titleLarge,
        color: palette.textPrimary,
        fontWeight: FontWeight.w800,
      ),
      titleMedium: inter.titleMedium?.copyWith(
        color: palette.textPrimary,
        fontWeight: FontWeight.w700,
      ),
      titleSmall: inter.titleSmall?.copyWith(
        color: palette.textPrimary,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: inter.bodyLarge?.copyWith(color: palette.textSecondary),
      bodyMedium: inter.bodyMedium?.copyWith(color: palette.textSecondary),
      bodySmall: inter.bodySmall?.copyWith(color: palette.textSecondary),
      labelLarge: inter.labelLarge?.copyWith(
        color: palette.textPrimary,
        fontWeight: FontWeight.w800,
      ),
      labelMedium: inter.labelMedium?.copyWith(
        color: palette.textSecondary,
        fontWeight: FontWeight.w700,
      ),
    );

    return base.copyWith(
      extensions: [AppThemePaletteExtension(palette: palette)],
      textTheme: textTheme,
      scaffoldBackgroundColor: palette.background,
      colorScheme: base.colorScheme.copyWith(
        surface: palette.backgroundSoft,
        surfaceContainer: palette.card,
        surfaceContainerHighest: palette.elevated,
        onSurface: palette.textPrimary,
        onSurfaceVariant: palette.textSecondary,
        primary: palette.primaryBright,
        secondary: palette.gold,
        tertiary: palette.accent,
        error: palette.danger,
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: false,
        backgroundColor: palette.background.withValues(alpha: 0.92),
        foregroundColor: palette.textPrimary,
        titleTextStyle: GoogleFonts.outfit(
          color: palette.textPrimary,
          fontSize: 20,
          fontWeight: FontWeight.w800,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: palette.card.withValues(alpha: 0.82),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: palette.card.withValues(alpha: 0.82),
        labelStyle: TextStyle(color: palette.textSecondary),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(20),
          borderSide: BorderSide(color: palette.primaryBright, width: 1.2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: palette.primaryBright,
          foregroundColor: Colors.white,
          disabledBackgroundColor: palette.elevated,
          disabledForegroundColor: palette.textMuted,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          minimumSize: const Size(48, 48),
          textStyle: textTheme.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: palette.textPrimary,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          side: BorderSide(color: Colors.white.withValues(alpha: 0.12)),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          minimumSize: const Size(48, 48),
          textStyle: textTheme.labelLarge,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        height: 82,
        backgroundColor: palette.card.withValues(alpha: 0.92),
        indicatorColor: palette.primaryBright.withValues(alpha: 0.18),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return textTheme.labelMedium?.copyWith(
            fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
            color: selected ? palette.primaryBright : palette.textSecondary,
          );
        }),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: palette.card.withValues(alpha: 0.78),
        selectedColor: palette.primaryBright.withValues(alpha: 0.22),
        labelStyle: textTheme.labelMedium,
        side: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: palette.elevated,
        contentTextStyle: textTheme.bodyMedium?.copyWith(color: palette.textPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static AppThemePalette of(BuildContext context) {
    final extension = Theme.of(context).extension<AppThemePaletteExtension>();
    return extension?.palette ?? AppColors.stadiumNight;
  }
}

class AppThemePaletteExtension extends ThemeExtension<AppThemePaletteExtension> {
  const AppThemePaletteExtension({required this.palette});

  final AppThemePalette palette;

  @override
  ThemeExtension<AppThemePaletteExtension> copyWith({AppThemePalette? palette}) {
    return AppThemePaletteExtension(palette: palette ?? this.palette);
  }

  @override
  ThemeExtension<AppThemePaletteExtension> lerp(
    covariant ThemeExtension<AppThemePaletteExtension>? other,
    double t,
  ) {
    if (other is! AppThemePaletteExtension) {
      return this;
    }

    Color mix(Color a, Color b) => Color.lerp(a, b, t)!;

    return AppThemePaletteExtension(
      palette: AppThemePalette(
        background: mix(palette.background, other.palette.background),
        backgroundSoft: mix(palette.backgroundSoft, other.palette.backgroundSoft),
        card: mix(palette.card, other.palette.card),
        elevated: mix(palette.elevated, other.palette.elevated),
        primary: mix(palette.primary, other.palette.primary),
        primaryBright: mix(palette.primaryBright, other.palette.primaryBright),
        gold: mix(palette.gold, other.palette.gold),
        goldSoft: mix(palette.goldSoft, other.palette.goldSoft),
        accent: mix(palette.accent, other.palette.accent),
        textPrimary: mix(palette.textPrimary, other.palette.textPrimary),
        textSecondary: mix(palette.textSecondary, other.palette.textSecondary),
        textMuted: mix(palette.textMuted, other.palette.textMuted),
        success: mix(palette.success, other.palette.success),
        danger: mix(palette.danger, other.palette.danger),
        warning: mix(palette.warning, other.palette.warning),
        info: mix(palette.info, other.palette.info),
        expert: mix(palette.expert, other.palette.expert),
      ),
    );
  }
}
