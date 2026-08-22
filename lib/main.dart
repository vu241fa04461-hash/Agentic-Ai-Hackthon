import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme/stitch_theme.dart';
import 'providers/defect_provider.dart';
import 'views/main_navigation_shell.dart';

void main() {
  runApp(const UrbanGuardAiApp());
}

class UrbanGuardAiApp extends StatelessWidget {
  const UrbanGuardAiApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => DefectProvider(),
      child: MaterialApp(
        title: 'Urban Pothole & Micro-Flooding Engine',
        debugShowCheckedModeBanner: false,
        theme: StitchTheme.lightTheme,
        home: const MainNavigationShell(),
      ),
    );
  }
}
