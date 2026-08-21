import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/defect_report.dart';

class DefectProvider with ChangeNotifier {
  final List<DefectReport> _reports = [
    DefectReport(
      id: "RPT-1001",
      location: "MG Road, Outer Junction",
      lat: 12.9716,
      lng: 77.5946,
      problem: "Pothole",
      severity: "High",
      water: "Yes",
      traffic: "Arterial",
      score: 95,
      sla: "12 Hours",
      status: "Open",
    ),
    DefectReport(
      id: "RPT-1002",
      location: "College Road North",
      lat: 12.9780,
      lng: 77.5890,
      problem: "Road Crack",
      severity: "Medium",
      water: "No",
      traffic: "Collector",
      score: 55,
      sla: "72 Hours",
      status: "In Progress",
    ),
    DefectReport(
      id: "RPT-1003",
      location: "Market Square Boulevard",
      lat: 12.9650,
      lng: 77.6020,
      problem: "Waterlogging",
      severity: "High",
      water: "Yes",
      traffic: "Arterial",
      score: 90,
      sla: "24 Hours",
      status: "Open",
    ),
    DefectReport(
      id: "RPT-1004",
      location: "Residential Lane 4",
      lat: 12.9610,
      lng: 77.5850,
      problem: "Pothole",
      severity: "Low",
      water: "No",
      traffic: "Residential",
      score: 35,
      sla: "7 Days",
      status: "Resolved",
    ),
  ];

  List<DefectReport> get reports => List.unmodifiable(_reports);

  int get totalReported => _reports.length;
  int get activePotholes => _reports.where((r) => r.problem == "Pothole" && r.status != "Resolved").length;
  int get floodZones => _reports.where((r) => r.water == "Yes" && r.status != "Resolved").length;
  int get resolvedCount => _reports.where((r) => r.status == "Resolved").length;

  void addReport(DefectReport report) {
    _reports.insert(0, report);
    notifyListeners();
  }

  void updateStatus(String id, String newStatus) {
    final index = _reports.indexWhere((r) => r.id == id);
    if (index != -1) {
      _reports[index].status = newStatus;
      notifyListeners();
    }
  }

  DefectReport calculateAndCreateReport({
    required String location,
    required String problem,
    required String severity,
    required String water,
    required String traffic,
    double? lat,
    double? lng,
  }) {
    final double finalLat = lat ?? (12.9716 + (Random().nextDouble() - 0.5) * 0.04);
    final double finalLng = lng ?? (77.5946 + (Random().nextDouble() - 0.5) * 0.04);

    int score = 0;
    if (severity == "High") score += 50;
    else if (severity == "Medium") score += 30;
    else score += 15;

    if (water == "Yes") score += 25;
    if (problem == "Pothole" || problem == "Manhole Defect") score += 15;
    if (traffic == "Arterial") score += 15;
    else if (traffic == "Collector") score += 10;
    else score += 5;

    score = score.clamp(0, 100);

    String sla = "7 Days";
    if (score >= 80) sla = "12 Hours";
    else if (score >= 55) sla = "48 Hours";

    final newReport = DefectReport(
      id: "RPT-${1000 + Random().nextInt(9000)}",
      location: location,
      lat: finalLat,
      lng: finalLng,
      problem: problem,
      severity: severity,
      water: water,
      traffic: traffic,
      score: score,
      sla: sla,
      status: "Open",
    );

    addReport(newReport);
    return newReport;
  }
}
