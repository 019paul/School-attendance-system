# ClassTrack — Primary School Attendance Management System

A modern, responsive school attendance management system built with React and TypeScript. ClassTrack helps schools manage student records, monitor daily attendance, organize classes and teachers, and generate attendance reports through an intuitive and user-friendly interface..

## Requirements

- Node.js LTS (includes npm)
- Visual Studio Code
- A web browser

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

In VS Code choose **File → Open Folder...** and select that folder.

## 3. Install project packages

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

## 5. Try these features

1. Open **Students** and add a test student.
2. Open **Attendance**, choose the student's class, select today's date, and set each student's status.
3. Click **Save attendance**.
4. Open **History** and try the search and filters.
5. Open **Reports** and export a CSV file.
6. Refresh the browser. Your students and attendance should still be there.

The sample student names and guardian details are fictional demo data. Replace them with no real student information until the app has proper authentication and security.

## Useful commands

```bash
npm run dev      # Run the development server
npm run build    # Check TypeScript and create a production build
npm run preview  # Preview the production build locally
```

Run `npm run build` before considering the prototype ready to deploy. Fix any errors shown in the terminal.

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
