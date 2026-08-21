# Stitch AI & Flutter Integration Workflow

This directory configures **Stitch AI** design workflows for the **Urban GIS Pothole & Micro-Flooding Engine** Flutter app.

---

## 1. How Stitch AI Works with this Flutter Project

1. **Design Tokens Synchronization**:
   - Stitch UI tokens are defined in `stitch/stitch_design_tokens.json`.
   - The Flutter `StitchTheme` (`lib/theme/stitch_theme.dart`) consumes these tokens directly to maintain absolute visual parity across screens.

2. **Component Stitching**:
   - Widgets in `lib/widgets/` are structured as modular Stitch components (`KpiStatsGrid`, `AiVisionHud`, `GisMapWidget`, `DefectRegistryTable`).
   - You can copy-paste or export Stitch AI-generated UI prompts directly into these widget files.

3. **Stitch Prompt Examples for App Refinements**:
   - *Prompt 1*: `"Generate a dark-mode theme variation using Stitch design tokens with glassmorphic cards and glowing status meters."`
   - *Prompt 2*: `"Create a Flutter camera capture dialog with automated bounding box overlay matching the AiVisionHud component."`

---

## 2. Running & Building the Flutter App

Once the Flutter SDK is installed on your computer:

```bash
# 1. Fetch Flutter packages
flutter pub get

# 2. Run in Chrome (Web) or Desktop / Mobile Emulator
flutter run -d chrome
```
