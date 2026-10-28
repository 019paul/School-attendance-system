# ClassTrack — Primary School Attendance Management System

A modern, responsive school attendance management system built with React and TypeScript. ClassTrack helps schools manage student records, monitor daily attendance, organize classes and teachers, and generate attendance reports through an intuitive and user-friendly interface..

## Key Features

Dashboard: View an overview of school attendance and student records.
Student Management: Add, view, and manage student information.
Class Management: Organize students by class.
Teacher Management: Manage teacher records.
Daily Attendance: Record and update students' attendance status.
Attendance History: Search and review previous attendance records.
Reports: Generate attendance summaries and export records to CSV.
Responsive Interface: Access the system through a compatible desktop or mobile browser.

## Technology Stack

Frontend: React and TypeScript
Build Tool: Vite
Package Manager: npm
Data Storage: Browser localStorage in the current implementation
Backend Integration: Supabase can be integrated for centralized data storage, authentication, and multi-user access.

## Requirements

- Node.js LTS (includes npm)
- Visual Studio Code
- A web browser
- Git for version control (optional)

## 1. Install Node.js

If you do not have Node.js, install the current LTS version from https://nodejs.org/. After installation, close and reopen VS Code.

In VS Code, open **Terminal → New Terminal** and check:

```bash
node -v
npm -v
```

Both commands should print version numbers.

## 2. Open this project

Extract the project ZIP to a folder you can find, for example `Documents/primary-school-attendance`.

Open Visual Studio Code, select File → Open Folder, and choose the project directory containing package.json.

## 3. Install Dependancies

In the VS Code terminal, run:

```bash
npm install
```

Wait until it finishes. You only need to do this again if dependencies change or you reinstall the project.

## 4. Start the website

Run:

```bash
npm run dev
```

Vite will print a local address, usually `http://localhost:5173/`. Hold **Ctrl** and click the address, or copy it into your browser.

Keep the terminal running while using the site. To stop the server, focus the terminal and press **Ctrl + C**.

## 5. Installation and Setup
- Install Node.js
Download and install Node.js from https://nodejs.org/.
After installation, restart your terminal and verify the installation:

```bash
node -v
npm -v
```
Both commands should display version numbers.

-- Open the Project
Open Visual Studio Code, select **File → Open Folder**, and choose the project directory containing `package.json`.
-- Install Dependencies
Open the integrated terminal and run:

```bash
npm install
```
Wait for the installation to complete.

-- Start ClassTrack
Run the development server:

```bash
npm run dev
```

Vite will display a local URL, usually `http://localhost:5173/`. Open that address in your browser to access the application.

Keep the terminal open while using the development server. Press `Ctrl + C` in the terminal to stop it.

## Important limitations

- There is no real login, backend, or multi-user sync in this starter.
- Data is stored in the current browser profile on this computer. Clearing browser storage can delete it.
- Do not use real children's personal data in a public deployment yet.
- Before real school use, add authentication, a shared database, server-side access rules, backups, and appropriate privacy protections.

## Project layout

```text
src/
  components/  # Reusable sidebar and modal
  pages/       # Dashboard, Students, Attendance, History, Reports
  types/       # TypeScript data types
  utils/       # Browser storage and date helpers
  App.tsx      # Main application and navigation
  main.tsx     # React entry point
  styles.css   # Responsive visual design
```

## Next learning steps

1. Understand the `Student` and `AttendanceRecord` types in `src/types/index.ts`.
2. Read `src/utils/storage.ts` to see how browser storage works.
3. Follow the student form in `src/pages/Students.tsx`.
4. Follow the attendance save/update logic in `src/pages/Attendance.tsx`.
5. Later, replace the storage helper with a Supabase data layer and add real authentication and database security.
