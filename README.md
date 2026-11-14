# Daily Progress Tracker

A simple, mobile-friendly task tracker that helps you stay consistent and see your progress over time. Add your own daily tasks, record completions, and view each task's history in its own calendar.

**Live app:** https://bhanureddy31.github.io/Daily-Progress-Tracker/  
**Source code:** https://github.com/bhanureddy31/Daily-Progress-Tracker

## Features

- **Personal task tracking** – create and manage individual tasks; this is not a problem-solving or coding-challenge tracker.
- **Per-task progress calendar** – see the completion history for each task, starting from the date it was added.
- **Daily completion tracking** – mark a task complete for the current day and update past dates from its calendar.
- **Current and maximum streaks** – view consecutive-day progress for each task.
- **Date protection** – prevents completion dates before a task's start date or in the future.
- **Backup and restore** – export your tasks and completion history to a JSON file, then import a valid backup when needed.
- **Data recovery safeguards** – validation and recovery options help protect stored data if the browser's saved data becomes corrupted.
- **Installable Progressive Web App (PWA)** – add the tracker to a supported phone or desktop home screen.
- **Offline support** – core app files are cached by a service worker for use after the app has loaded successfully online.
- **No external JavaScript libraries** – built with HTML, CSS, and vanilla JavaScript.

## Try the app

Open the [Daily Progress Tracker](https://bhanureddy31.github.io/Daily-Progress-Tracker/) in a modern browser. You can start adding tasks without creating an account.

## Run locally

1. Clone or download this repository.
2. Open the project folder.
3. Start a local development server (for example, the VS Code Live Server extension).
4. Open the local URL provided by the server.

The app is made from static files, so no backend server or package installation is required for basic local use. For PWA installation and service-worker behavior, use localhost or the deployed HTTPS site rather than opening the HTML file directly.

## Install on a phone

### Android (Chrome)
1. Open the [live app](https://bhanureddy31.github.io/Daily-Progress-Tracker/) in Chrome.
2. Open the browser menu.
3. Choose **Install app** or **Add to Home screen** (the wording can vary by device).
4. Follow the prompts.

### iPhone or iPad (Safari)
1. Open the live app in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Confirm the app name and tap **Add**.

Installation options can vary by browser and operating-system version.

## Back up your progress

Your tasks and completion history are stored in the browser on the device where you use the app.

- **Export regularly:** use **Export Backup** to download a JSON copy of your tasks and progress.
- **Restore when needed:** use **Import Backup** and select a previously exported JSON file.
- **Keep a safe copy:** store exported backups somewhere separate from the browser and device.

**Important:** browser storage is not cloud synchronization. Your tasks do not automatically move between devices or browsers. Clearing the browser's site data can remove locally stored progress, so export a backup before clearing site data or changing devices.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Browser localStorage
- Progressive Web App manifest
- Service Worker and Cache API

## Privacy

The app stores task data locally in your browser. It does not require an account or a project-specific backend to save your tasks. If you use the app on multiple devices, each browser has its own local data unless you manually transfer progress using a backup file.

## License

A license has not yet been added to this repository. Until a license is selected and included, do not assume that the source code is available for reuse, modification, or redistribution.
