# Daily Progress Tracker

A lightweight, mobile-responsive, installable Progressive Web App (PWA) to track your daily habits and tasks, build consistency, and visualize your progress with interactive calendars and streak counts.

## ✨ Features
- **Daily Habit & Task Tracking**: Add tasks and mark them done with a single tap.
- **Accessible Interactive Calendars**: Each task has its own calendar rendered with native button elements, full keyboard navigation (Tab, Enter, Space), and screen-reader announcements showing completed dates with green badges and checkmarks (`✓`).
- **Streak Calculation**: Automatically tracks current consecutive day streaks and all-time maximum streaks.
- **Date Protection**: Restricts date selection to prevent marking dates prior to task creation or future dates.
- **Data Safety & Integrity**: Robust JSON validation prevents corrupted data from overwriting stored habits, with fallback options to inspect and recover raw data.
- **Backup & Restore**:
  - **Export Backup**: Download all your tasks and completion history as a structured JSON file (`daily-progress-tracker-backup.json`).
  - **Import Backup**: Restore tasks from a previous backup with schema validation and confirmation to prevent accidental data loss.
- **Installable PWA**: Install directly onto Android or iOS home screens via Chrome or Safari.
- **Reliable Offline Support**: Equipped with a Service Worker caching assets for offline access and scoped cache cleanup.
- **Zero External Dependencies**: Built purely with HTML5, CSS3, and vanilla JavaScript using browser `localStorage`.

## 💾 Backup and Restore Guide
- **Export Backup**: Click the **"Export Backup"** button in the header of the tasks section to download a JSON snapshot of your current habits, start dates, and completion histories.
- **Import Backup**: Click the **"Import Backup"** button and select a previously exported `.json` file. The app validates the file format and each task record before prompting for confirmation to prevent accidental overwrites.

## 📱 Mobile Installation (PWA)
1. Open the deployed website link in **Google Chrome** on your phone.
2. Tap the **three-dots menu (⋮)** in the top right.
3. Select **"Install app"** or **"Add to Home screen"**.
4. Launch the app directly from your phone's home screen or app drawer.

## 🔒 Data Privacy
All tasks and completion history are stored strictly on your local device via browser `localStorage`. No personal data is sent to any external server.
