import 'package:flutter/material.dart';
import '../theme/stitch_theme.dart';
import 'screens/dashboard_screen.dart';
import 'screens/ai_inspector_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/work_orders_screen.dart';
import 'screens/settings_screen.dart';

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({Key? key}) : super(key: key);

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _selectedIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    AiInspectorScreen(),
    AnalyticsScreen(),
    WorkOrdersScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: StitchTheme.secondary,
        elevation: 4,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: StitchTheme.primary,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.show_chart, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Urban Pothole & Micro-Flooding Engine",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                Text(
                  "Stitch AI Multi-Screen Flutter App Architecture",
                  style: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontWeight: FontWeight.w600,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWideScreen = constraints.maxWidth > 900;
          if (isWideScreen) {
            return Row(
              children: [
                NavigationRail(
                  selectedIndex: _selectedIndex,
                  onDestinationSelected: (index) => setState(() => _selectedIndex = index),
                  labelType: NavigationRailLabelType.all,
                  backgroundColor: StitchTheme.surface,
                  selectedIconTheme: const IconThemeData(color: StitchTheme.primary, size: 28),
                  unselectedIconTheme: const IconThemeData(color: StitchTheme.textMuted, size: 24),
                  selectedLabelTextStyle: const TextStyle(
                    color: StitchTheme.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                  unselectedLabelTextStyle: const TextStyle(
                    color: StitchTheme.textMuted,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                  destinations: const [
                    NavigationRailDestination(
                      icon: Icon(Icons.map_outlined),
                      selectedIcon: Icon(Icons.map),
                      label: Text("Dashboard"),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.camera_alt_outlined),
                      selectedIcon: Icon(Icons.camera_alt),
                      label: Text("Inspector"),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.pie_chart_outline),
                      selectedIcon: Icon(Icons.pie_chart),
                      label: Text("Analytics"),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.list_alt_outlined),
                      selectedIcon: Icon(Icons.list_alt),
                      label: Text("Work Orders"),
                    ),
                    NavigationRailDestination(
                      icon: Icon(Icons.settings_outlined),
                      selectedIcon: Icon(Icons.settings),
                      label: Text("Settings"),
                    ),
                  ],
                ),
                const VerticalDivider(thickness: 1, width: 1, color: StitchTheme.border),
                Expanded(child: IndexedStack(index: _selectedIndex, children: _screens)),
              ],
            );
          } else {
            return IndexedStack(index: _selectedIndex, children: _screens);
          }
        },
      ),
      bottomNavigationBar: MediaQuery.of(context).size.width <= 900
          ? BottomNavigationBar(
              currentIndex: _selectedIndex,
              onTap: (index) => setState(() => _selectedIndex = index),
              type: BottomNavigationBarType.fixed,
              selectedItemColor: StitchTheme.primary,
              unselectedItemColor: StitchTheme.textMuted,
              selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
              items: const [
                BottomNavigationBarItem(icon: Icon(Icons.map_outlined), label: "Dashboard"),
                BottomNavigationBarItem(icon: Icon(Icons.camera_alt_outlined), label: "Inspector"),
                BottomNavigationBarItem(icon: Icon(Icons.pie_chart_outline), label: "Analytics"),
                BottomNavigationBarItem(icon: Icon(Icons.list_alt_outlined), label: "Work Orders"),
                BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), label: "Settings"),
              ],
            )
          : null,
    );
  }
}
