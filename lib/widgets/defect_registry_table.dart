import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/defect_provider.dart';
import '../models/defect_report.dart';
import '../theme/stitch_theme.dart';

class DefectRegistryTable extends StatefulWidget {
  const DefectRegistryTable({Key? key}) : super(key: key);

  @override
  State<DefectRegistryTable> createState() => _DefectRegistryTableState();
}

class _DefectRegistryTableState extends State<DefectRegistryTable> {
  String _searchQuery = "";
  String _severityFilter = "ALL";

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DefectProvider>(context);

    final filteredReports = provider.reports.where((r) {
      final matchesSearch = r.location.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          r.id.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          r.problem.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesSev = _severityFilter == "ALL" || r.severity == _severityFilter;
      return matchesSearch && matchesSev;
    }).toList();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.list_alt, color: StitchTheme.primary),
                const SizedBox(width: 10),
                Text("Registered Urban Defect Logs",
                    style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 16),

            // Toolbar
            Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: "Search location or report ID...",
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: (val) => setState(() => _searchQuery = val),
                  ),
                ),
                const SizedBox(width: 12),
                DropdownButton<String>(
                  value: _severityFilter,
                  items: const [
                    DropdownMenuItem(value: "ALL", child: Text("All Severities")),
                    DropdownMenuItem(value: "High", child: Text("High Severity")),
                    DropdownMenuItem(value: "Medium", child: Text("Medium Severity")),
                    DropdownMenuItem(value: "Low", child: Text("Low Severity")),
                  ],
                  onChanged: (val) => setState(() => _severityFilter = val!),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Scrollable Data Table
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columns: const [
                  DataColumn(label: Text("ID")),
                  DataColumn(label: Text("LOCATION")),
                  DataColumn(label: Text("TYPE")),
                  DataColumn(label: Text("SEVERITY")),
                  DataColumn(label: Text("WATERLOGGED")),
                  DataColumn(label: Text("PRIORITY")),
                  DataColumn(label: Text("STATUS")),
                ],
                rows: filteredReports.map((r) {
                  return DataRow(
                    cells: [
                      DataCell(Text(r.id, style: const TextStyle(fontWeight: FontWeight.w800, color: StitchTheme.primary))),
                      DataCell(Text(r.location, style: const TextStyle(fontWeight: FontWeight.w700))),
                      DataCell(Text(r.problem)),
                      DataCell(_buildBadge(r.severity)),
                      DataCell(Text(r.water == "Yes" ? "💧 Waterlogged" : "Dry")),
                      DataCell(Text("${r.score}/100", style: const TextStyle(fontWeight: FontWeight.w800))),
                      DataCell(
                        DropdownButton<String>(
                          value: r.status,
                          items: const [
                            DropdownMenuItem(value: "Open", child: Text("Open")),
                            DropdownMenuItem(value: "In Progress", child: Text("In Progress")),
                            DropdownMenuItem(value: "Resolved", child: Text("Resolved")),
                          ],
                          onChanged: (newStatus) {
                            if (newStatus != null) {
                              provider.updateStatus(r.id, newStatus);
                            }
                          },
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String severity) {
    Color bg = StitchTheme.successLight;
    Color fg = StitchTheme.success;
    if (severity == "High") {
      bg = StitchTheme.dangerLight;
      fg = StitchTheme.danger;
    } else if (severity == "Medium") {
      bg = StitchTheme.warningLight;
      fg = StitchTheme.warning;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        severity,
        style: TextStyle(color: fg, fontWeight: FontWeight.w800, fontSize: 12),
      ),
    );
  }
}
