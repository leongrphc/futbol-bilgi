import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static ThemeData dark() {
    final base = FlexThemeData.dark(
      scheme: FlexScheme.greenM3,
      surfaceMode: FlexSurfaceMode.highScaffoldLowSurface,
      blendLevel: 16,
      appBarStyle: FlexAppBarStyle.background,
      useMaterial3: true,
    );

    return base.copyWith(
      textTheme: GoogleFonts.interTextTheme(base.textTheme),
    );
  }
}
