import 'package:flutter/material.dart';
import '../../widgets/defect_registry_table.dart';

class WorkOrdersScreen extends StatelessWidget {
  const WorkOrdersScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Repair Squad Work Orders & SLA Tracker",
              style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 4),
          const Text("Manage dispatch work orders, update repair statuses, and export reports",
              style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
          const SizedBox(height: 24),

          // Main Registry Table Component
          const DefectRegistryTable(),
        ],
      ),
    );
  }
}
