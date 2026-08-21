import 'package:flutter/material.dart';
import '../../widgets/kpi_stats_grid.dart';
import '../../widgets/gis_map_widget.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Urban GIS Overview",
                      style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 4),
                  const Text("Real-time pothole & micro-flooding telemetry",
                      style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                ],
              ),
              Chip(
                backgroundColor: const Color(0xFFEFF6FF),
                side: const BorderSide(color: Color(0xFF2563EB)),
                avatar: const Icon(Icons.circle, color: Color(0xFF10B981), size: 10),
                label: const Text("GIS Telemetry Active",
                    style: TextStyle(color: Color(0xFF2563EB), fontWeight: FontWeight.w800, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // KPI Stats Grid
          const KpiStatsGrid(),
          const SizedBox(height: 24),

          // Main GIS Map View
          const GisMapWidget(),
        ],
      ),
    );
  }
}
