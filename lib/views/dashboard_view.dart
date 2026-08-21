import 'package:flutter/material.dart';
import '../theme/stitch_theme.dart';
import '../widgets/kpi_stats_grid.dart';
import '../widgets/gis_map_widget.dart';
import '../widgets/ai_vision_hud.dart';
import '../widgets/defect_registry_table.dart';

class DashboardView extends StatelessWidget {
  const DashboardView({Key? key}) : super(key: key);

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
                  "Flutter & Stitch AI GIS Intelligence System",
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
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // KPI Stat Grid
            const KpiStatsGrid(),
            const SizedBox(height: 24),

            // Responsive Layout Grid (GIS Map + Vision HUD Form)
            LayoutBuilder(
              builder: (context, constraints) {
                if (constraints.maxWidth > 900) {
                  return const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 6, child: GisMapWidget()),
                      SizedBox(width: 20),
                      Expanded(flex: 5, child: AiVisionHud()),
                    ],
                  );
                } else {
                  return const Column(
                    children: [
                      GisMapWidget(),
                      SizedBox(height: 20),
                      AiVisionHud(),
                    ],
                  );
                }
              },
            ),
            const SizedBox(height: 24),

            // Defect Logs Table
            const DefectRegistryTable(),
          ],
        ),
      ),
    );
  }
}
