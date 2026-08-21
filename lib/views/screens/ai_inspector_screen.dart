import 'package:flutter/material.dart';
import '../../widgets/ai_vision_hud.dart';

class AiInspectorScreen extends StatelessWidget {
  const AiInspectorScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Computer Vision Defect Inspector",
              style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          const Text("Upload or capture road photos for automated YOLO edge detection",
              style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
          const SizedBox(height: 24),

          // Main Vision HUD Component
          const AiVisionHud(),
        ],
      ),
    );
  }
}
