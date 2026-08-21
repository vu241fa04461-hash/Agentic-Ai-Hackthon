import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/defect_provider.dart';
import '../theme/stitch_theme.dart';

class KpiStatsGrid extends StatelessWidget {
  const KpiStatsGrid({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DefectProvider>(context);

    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth > 800;
        return GridView.count(
          crossAxisCount: isDesktop ? 4 : 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: isDesktop ? 1.8 : 1.4,
          children: [
            _buildStatCard(
              context,
              title: "TOTAL REPORTED",
              value: provider.totalReported.toString(),
              icon: Icons.error_outline,
              accentColor: StitchTheme.primary,
              iconBg: StitchTheme.primaryLight,
            ),
            _buildStatCard(
              context,
              title: "ACTIVE POTHOLES",
              value: provider.activePotholes.toString(),
              icon: Icons.adjust,
              accentColor: StitchTheme.danger,
              iconBg: StitchTheme.dangerLight,
            ),
            _buildStatCard(
              context,
              title: "FLOOD RISK ZONES",
              value: provider.floodZones.toString(),
              icon: Icons.water_drop_outlined,
              accentColor: StitchTheme.water,
              iconBg: StitchTheme.waterLight,
            ),
            _buildStatCard(
              context,
              title: "RESOLVED ISSUES",
              value: provider.resolvedCount.toString(),
              icon: Icons.check_circle_outline,
              accentColor: StitchTheme.success,
              iconBg: StitchTheme.successLight,
            ),
          ],
        );
      },
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required IconData icon,
    required Color accentColor,
    required Color iconBg,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: StitchTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: StitchTheme.border),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(15, 23, 42, 0.04),
            blurRadius: 10,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            Positioned(
              top: 0, left: 0, right: 0,
              height: 4,
              child: Container(color: accentColor),
            ),
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              letterSpacing: 0.8,
                              fontWeight: FontWeight.w800,
                            ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        value,
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                              color: StitchTheme.textMain,
                              fontWeight: FontWeight.w900,
                            ),
                      ),
                    ],
                  ),
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: iconBg,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, color: accentColor, size: 26),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
