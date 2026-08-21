import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/defect_provider.dart';
import '../theme/stitch_theme.dart';

class GisMapWidget extends StatelessWidget {
  const GisMapWidget({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<DefectProvider>(context);
    final defaultCenter = LatLng(12.9716, 77.5946);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.map_outlined, color: StitchTheme.primary),
                    const SizedBox(width: 10),
                    Text("Real-Time GIS Defect & Waterlogging Map",
                        style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
                OutlinedButton.icon(
                  icon: const Icon(Icons.my_location, size: 16),
                  label: const Text("Center City"),
                  onPressed: () {},
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Flutter Map View
            SizedBox(
              height: 380,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: FlutterMap(
                  options: MapOptions(
                    center: defaultCenter,
                    zoom: 13.0,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.roadmind.ai',
                    ),
                    MarkerLayer(
                      markers: provider.reports.map((r) {
                        Color markerColor = StitchTheme.primary;
                        if (r.status == 'Resolved') {
                          markerColor = StitchTheme.success;
                        } else if (r.severity == 'High') {
                          markerColor = StitchTheme.danger;
                        } else if (r.water == 'Yes') {
                          markerColor = StitchTheme.water;
                        } else if (r.severity == 'Medium') {
                          markerColor = StitchTheme.warning;
                        }

                        return Marker(
                          point: LatLng(r.lat, r.lng),
                          width: 30,
                          height: 30,
                          child: GestureDetector(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text("${r.id} - ${r.problem} at ${r.location}"),
                                  backgroundColor: StitchTheme.secondary,
                                ),
                              );
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: markerColor,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 3),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Colors.black26,
                                    blurRadius: 6,
                                    offset: Offset(0, 3),
                                  )
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
