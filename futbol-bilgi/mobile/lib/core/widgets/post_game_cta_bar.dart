import 'package:flutter/material.dart';

class PostGameCtaBar extends StatelessWidget {
  const PostGameCtaBar({
    super.key,
    required this.primaryLabel,
    required this.onPrimary,
    required this.secondaryLabel,
    required this.onSecondary,
    required this.tertiaryLabel,
    required this.onTertiary,
    this.primaryIcon = Icons.play_arrow_rounded,
    this.secondaryIcon = Icons.share_rounded,
    this.tertiaryIcon = Icons.home_rounded,
  });

  final String primaryLabel;
  final VoidCallback? onPrimary;
  final String secondaryLabel;
  final VoidCallback? onSecondary;
  final String tertiaryLabel;
  final VoidCallback? onTertiary;
  final IconData primaryIcon;
  final IconData secondaryIcon;
  final IconData tertiaryIcon;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FilledButton.icon(
          onPressed: onPrimary,
          style: FilledButton.styleFrom(
            minimumSize: const Size.fromHeight(54),
          ),
          icon: Icon(primaryIcon),
          label: Text(primaryLabel),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: onSecondary,
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(54),
          ),
          icon: Icon(secondaryIcon),
          label: Text(secondaryLabel),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: onTertiary,
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(54),
          ),
          icon: Icon(tertiaryIcon),
          label: Text(tertiaryLabel),
        ),
      ],
    );
  }
}
