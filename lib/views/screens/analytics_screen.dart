import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/defect_provider.dart';
import '../../theme/stitch_theme.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DefectProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Urban Infrastructure Analytics",
              style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          const Text("Defect distribution & severity trends across city zones",
              style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
          const SizedBox(height: 24),

          LayoutBuilder(
            builder: (context, constraints) {
              final isDesktop = constraints.maxWidth > 800;
              return Flex(
                direction: isDesktop ? Axis.horizontal : Axis.vertical,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Defect Type Breakdown Card
                  Expanded(
                    flex: isDesktop ? 1 : 0,
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Defect Category Breakdown",
                                style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 20),
                            SizedBox(
                              height: 240,
                              child: PieChart(
                                PieChartData(
                                  sectionsSpace: 4,
                                  centerSpaceRadius: 40,
                                  sections: [
                                    PieChartSectionData(
                                      color: StitchTheme.danger,
                                      value: provider.reports.where((r) => r.problem == 'Pothole').length.toDouble(),
                                      title: 'Pothole',
                                      radius: 50,
                                      titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                    ),
                                    PieChartSectionData(
                                      color: StitchTheme.warning,
                                      value: provider.reports.where((r) => r.problem == 'Road Crack').length.toDouble(),
                                      title: 'Crack',
                                      radius: 50,
                                      titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                    ),
                                    PieChartSectionData(
                                      color: StitchTheme.water,
                                      value: provider.reports.where((r) => r.problem == 'Waterlogging').length.toDouble(),
                                      title: 'Flood',
                                      radius: 50,
                                      titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (isDesktop) const SizedBox(width: 20) else const SizedBox(height: 20),

                  // Severity Breakdown Card
                  Expanded(
                    flex: isDesktop ? 1 : 0,
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Severity & Urgency Distribution",
                                style: Theme.of(context).textTheme.titleMedium),
                            const SizedBox(height: 20),
                            SizedBox(
                              height: 240,
                              child: BarChart(
                                BarChartData(
                                  borderData: FlBorderData(show: false),
                                  titlesData: const FlTitlesData(
                                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                  ),
                                  barGroups: [
                                    BarChartGroupData(x: 0, barRods: [
                                      BarChartRodData(
                                        toY: provider.reports.where((r) => r.severity == 'High').length.toDouble(),
                                        color: StitchTheme.danger,
                                        width: 28,
                                        borderRadius: BorderRadius.circular(6),
                                      )
                                    ]),
                                    BarChartGroupData(x: 1, barRods: [
                                      BarChartRodData(
                                        toY: provider.reports.where((r) => r.severity == 'Medium').length.toDouble(),
                                        color: StitchTheme.warning,
                                        width: 28,
                                        borderRadius: BorderRadius.circular(6),
                                      )
                                    ]),
                                    BarChartGroupData(x: 2, barRods: [
                                      BarChartRodData(
                                        toY: provider.reports.where((r) => r.severity == 'Low').length.toDouble(),
                                        color: StitchTheme.success,
                                        width: 28,
                                        borderRadius: BorderRadius.circular(6),
                                      )
                                    ]),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
