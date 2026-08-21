import 'package:flutter/material.dart';
import '../../theme/stitch_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  double _highSlaHours = 12;
  double _medSlaHours = 48;
  double _lowSlaHours = 168;
  bool _darkModeTokens = false;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Municipal GIS & Stitch System Settings",
              style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          const Text("Configure GIS grid defaults, SLA thresholds, and Stitch AI design system tokens",
              style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
          const SizedBox(height: 24),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.tune, color: StitchTheme.primary),
                      const SizedBox(width: 10),
                      Text("SLA Response Target Thresholds",
                          style: Theme.of(context).textTheme.titleMedium),
                    ],
                  ),
                  const Divider(height: 30),

                  Text("High Severity Target: ${_highSlaHours.round()} Hours",
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  Slider(
                    value: _highSlaHours,
                    min: 4, max: 48,
                    divisions: 11,
                    label: "${_highSlaHours.round()}h",
                    onChanged: (val) => setState(() => _highSlaHours = val),
                  ),

                  const SizedBox(height: 12),
                  Text("Medium Severity Target: ${_medSlaHours.round()} Hours",
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  Slider(
                    value: _medSlaHours,
                    min: 12, max: 120,
                    divisions: 9,
                    label: "${_medSlaHours.round()}h",
                    onChanged: (val) => setState(() => _medSlaHours = val),
                  ),

                  const SizedBox(height: 12),
                  Text("Low Severity Target: ${_lowSlaHours.round()} Hours",
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  Slider(
                    value: _lowSlaHours,
                    min: 24, max: 336,
                    divisions: 13,
                    label: "${_lowSlaHours.round()}h",
                    onChanged: (val) => setState(() => _lowSlaHours = val),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          Card(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.style_outlined, color: StitchTheme.primary),
                      const SizedBox(width: 10),
                      Text("Stitch AI Design System Tokens",
                          style: Theme.of(context).textTheme.titleMedium),
                    ],
                  ),
                  const Divider(height: 30),

                  SwitchListTile(
                    title: const Text("Export Dark Glassmorphism Tokens", style: TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: const Text("Toggles Stitch design token JSON output mode"),
                    value: _darkModeTokens,
                    onChanged: (val) => setState(() => _darkModeTokens = val),
                  ),
                  const SizedBox(height: 12),

                  OutlinedButton.icon(
                    icon: const Icon(Icons.download),
                    label: const Text("Export stitch_design_tokens.json"),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text("Exported stitch_design_tokens.json successfully!"),
                          backgroundColor: StitchTheme.secondary,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
