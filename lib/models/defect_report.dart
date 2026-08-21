class DefectReport {
  final String id;
  final String location;
  final double lat;
  final double lng;
  final String problem;
  final String severity;
  final String water;
  final String traffic;
  final int score;
  final String sla;
  String status;

  DefectReport({
    required this.id,
    required this.location,
    required this.lat,
    required this.lng,
    required this.problem,
    required this.severity,
    required this.water,
    required this.traffic,
    required this.score,
    required this.sla,
    required this.status,
  });

  factory DefectReport.fromJson(Map<String, dynamic> json) {
    return DefectReport(
      id: json['id'],
      location: json['location'],
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      problem: json['problem'],
      severity: json['severity'],
      water: json['water'],
      traffic: json['traffic'],
      score: json['score'],
      sla: json['sla'],
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'location': location,
      'lat': lat,
      'lng': lng,
      'problem': problem,
      'severity': severity,
      'water': water,
      'traffic': traffic,
      'score': score,
      'sla': sla,
      'status': status,
    };
  }
}
