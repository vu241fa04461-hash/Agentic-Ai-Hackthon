import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/defect_provider.dart';
import '../models/defect_report.dart';
import '../theme/stitch_theme.dart';

class AiVisionHud extends StatefulWidget {
  const AiVisionHud({Key? key}) : super(key: key);

  @override
  State<AiVisionHud> createState() => _AiVisionHudState();
}

class _AiVisionHudState extends State<AiVisionHud> {
  final _formKey = GlobalKey<FormState>();
  final _locationController = TextEditingController();
  final _descController = TextEditingController();

  String _problemType = "Pothole";
  String _severity = "Medium";
  String _waterlogging = "No";
  String _trafficTier = "Collector";
  bool _isAnalyzing = false;
  DefectReport? _lastAssessment;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.camera_alt_outlined, color: StitchTheme.primary),
                  const SizedBox(width: 10),
                  Text("Smart Defect Submission & Vision AI",
                      style: Theme.of(context).textTheme.titleMedium),
                ],
              ),
              const Divider(height: 30),

              // Upload Dropzone Placeholder
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: StitchTheme.border, width: 1.5),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.cloud_upload_outlined,
                          color: StitchTheme.primary, size: 28),
                    ),
                    const SizedBox(height: 8),
                    const Text("Click to select road defect photo",
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    const Text("Supports JPG, PNG, WEBP",
                        style: TextStyle(color: StitchTheme.textMuted, fontSize: 12)),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Location Input
              TextFormField(
                controller: _locationController,
                decoration: InputDecoration(
                  labelText: "Incident Location / Road Name",
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.my_location, color: StitchTheme.primary),
                    onPressed: () {
                      _locationController.text = "GPS Location: Lat 12.9716, Lng 77.5946";
                    },
                  ),
                ),
                validator: (val) => val == null || val.isEmpty ? "Location required" : null,
              ),
              const SizedBox(height: 14),

              // Dropdowns Row 1
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _problemType,
                      decoration: const InputDecoration(labelText: "Defect Category"),
                      items: const [
                        DropdownMenuItem(value: "Pothole", child: Text("Severe Pothole")),
                        DropdownMenuItem(value: "Road Crack", child: Text("Road Crack")),
                        DropdownMenuItem(value: "Waterlogging", child: Text("Waterlogging")),
                        DropdownMenuItem(value: "Manhole Defect", child: Text("Manhole Defect")),
                      ],
                      onChanged: (val) => setState(() => _problemType = val!),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _severity,
                      decoration: const InputDecoration(labelText: "Severity Level"),
                      items: const [
                        DropdownMenuItem(value: "High", child: Text("High Danger")),
                        DropdownMenuItem(value: "Medium", child: Text("Medium")),
                        DropdownMenuItem(value: "Low", child: Text("Low")),
                      ],
                      onChanged: (val) => setState(() => _severity = val!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Dropdowns Row 2
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _waterlogging,
                      decoration: const InputDecoration(labelText: "Waterlogging"),
                      items: const [
                        DropdownMenuItem(value: "No", child: Text("No Water")),
                        DropdownMenuItem(value: "Yes", child: Text("Yes (Flooded)")),
                      ],
                      onChanged: (val) => setState(() => _waterlogging = val!),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _trafficTier,
                      decoration: const InputDecoration(labelText: "Traffic Tier"),
                      items: const [
                        DropdownMenuItem(value: "Arterial", child: Text("Arterial Highway")),
                        DropdownMenuItem(value: "Collector", child: Text("Collector Road")),
                        DropdownMenuItem(value: "Residential", child: Text("Residential")),
                      ],
                      onChanged: (val) => setState(() => _trafficTier = val!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  icon: _isAnalyzing
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.memory),
                  label: Text(_isAnalyzing ? "Analyzing with Vision AI..." : "Analyze & Register Defect"),
                  onPressed: _isAnalyzing ? null : _submitReport,
                ),
              ),

              // AI Verified Result Card
              if (_lastAssessment != null) ...[
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: StitchTheme.successLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF86EFAC), width: 1.5),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.check_circle, color: Color(0xFF166534), size: 20),
                              SizedBox(width: 6),
                              Text("AI Assessment Verified",
                                  style: TextStyle(
                                      fontWeight: FontWeight.w800, color: Color(0xFF166534))),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              "Priority: ${_lastAssessment!.score}/100",
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800, color: StitchTheme.danger),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text("Resolution SLA: Within ${_lastAssessment!.sla}",
                          style: const TextStyle(fontWeight: FontWeight.w700, color: StitchTheme.textMain)),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _submitReport() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isAnalyzing = true);

    await Future.delayed(const Duration(milliseconds: 600));

    final provider = Provider.of<DefectProvider>(context, listen: false);
    final report = provider.calculateAndCreateReport(
      location: _locationController.text,
      problem: _problemType,
      severity: _severity,
      water: _waterlogging,
      traffic: _trafficTier,
    );

    setState(() {
      _isAnalyzing = false;
      _lastAssessment = report;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Registered Defect ${report.id}"),
        backgroundColor: StitchTheme.secondary,
      ),
    );
  }
}
