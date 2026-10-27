import type { AttendanceRecord, SchoolClass, Student, TeacherAccount, User } from "../types";

const STUDENTS_KEY = "classtrack_students_v1";
const ATTENDANCE_KEY = "classtrack_attendance_v1";
const TEACHERS_KEY = "classtrack_teachers_v1";
const SESSION_KEY = "classtrack_session_v1";
const CLASSES_KEY = "classtrack_classes_v1";

export const initialClasses: SchoolClass[] = [
  { id: "cls-1", name: "Primary 1", gradeLevel: 1 },
  { id: "cls-2", name: "Primary 2", gradeLevel: 2 },
  { id: "cls-3", name: "Primary 3", gradeLevel: 3 },
  { id: "cls-4", name: "Primary 4", gradeLevel: 4 },
  { id: "cls-5", name: "Primary 5", gradeLevel: 5 },
  { id: "cls-6", name: "Primary 6", gradeLevel: 6 },
];

export const initialTeachers: TeacherAccount[] = [
  {
    id: "tea-1",
    name: "Mr. Chukwuemeka Okafor",
    email: "mr.okafor@greenfield.edu",
    assignedClasses: ["Primary 1"],
    status: "active",
    createdAt: "2026-09-01",
  },
  {
    id: "tea-2",
    name: "Mrs. Kemi Adebayo",
    email: "mrs.adebayo@greenfield.edu",
    assignedClasses: ["Primary 2", "Primary 3"],
    status: "active",
    createdAt: "2026-09-01",
  },
  {
    id: "tea-3",
    name: "Ms. Clara Taylor",
    email: "ms.taylor@greenfield.edu",
    assignedClasses: [],
    status: "active",
    createdAt: "2026-10-15",
  },
];

const initialStudents: Student[] = [
  { id: "stu-1", admissionNumber: "GPS-2026-001", name: "Ada Okafor", className: "Primary 1", guardianName: "Mrs. Okafor", guardianPhone: "08000000001", status: "active", enrolledDate: "2026-01-10" },
  { id: "stu-2", admissionNumber: "GPS-2026-002", name: "Tunde Bello", className: "Primary 1", guardianName: "Mr. Bello", guardianPhone: "08000000002", status: "active", enrolledDate: "2026-01-10" },
  { id: "stu-3", admissionNumber: "GPS-2026-003", name: "Mariam Yusuf", className: "Primary 1", guardianName: "Mrs. Yusuf", guardianPhone: "08000000003", status: "active", enrolledDate: "2026-01-10" },
  { id: "stu-4", admissionNumber: "GPS-2026-004", name: "Chidi Eze", className: "Primary 2", guardianName: "Mr. Eze", guardianPhone: "08000000004", status: "active", enrolledDate: "2026-01-10" },
  { id: "stu-5", admissionNumber: "GPS-2026-005", name: "Zainab Musa", className: "Primary 2", guardianName: "Mrs. Musa", guardianPhone: "08000000005", status: "active", enrolledDate: "2026-01-10" },
  { id: "stu-6", admissionNumber: "GPS-2026-006", name: "Kemi Adebayo", className: "Primary 3", guardianName: "Mrs. Adebayo", guardianPhone: "08000000006", status: "active", enrolledDate: "2026-01-10" },
  { id: "stu-7", admissionNumber: "GPS-2026-007", name: "David James", className: "Primary 3", guardianName: "Mr. James", guardianPhone: "08000000007", status: "active", enrolledDate: "2026-01-10" },
  { id: "stu-8", admissionNumber: "GPS-2026-008", name: "Ngozi Nwosu", className: "Primary 4", guardianName: "Mrs. Nwosu", guardianPhone: "08000000008", status: "active", enrolledDate: "2026-01-10" },
];

function readJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadClasses(): SchoolClass[] {
  const classes = readJson<SchoolClass[] | null>(CLASSES_KEY, null);
  if (classes && classes.length > 0) return classes;
  localStorage.setItem(CLASSES_KEY, JSON.stringify(initialClasses));
  return initialClasses;
}

export function saveClasses(classes: SchoolClass[]): void {
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
}

export function loadStudents(): Student[] {
  const raw = readJson<Student[] | null>(STUDENTS_KEY, null);
  if (!raw) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(initialStudents));
    return initialStudents;
  }
  return raw.map((s, idx) => ({
    ...s,
    admissionNumber: s.admissionNumber || `GPS-2026-${String(idx + 1).padStart(3, "0")}`,
    status: s.status || "active",
    enrolledDate: s.enrolledDate || "2026-01-10",
  }));
}

export function saveStudents(students: Student[]): void {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
}

export function loadAttendance(): AttendanceRecord[] {
  return readJson<AttendanceRecord[]>(ATTENDANCE_KEY, []);
}

export function saveAttendance(records: AttendanceRecord[]): void {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

export function todayISO(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function formatDate(date: string): string {
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function loadTeachers(): TeacherAccount[] {
  const teachers = readJson<TeacherAccount[] | null>(TEACHERS_KEY, null);
  if (teachers) return teachers;
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(initialTeachers));
  return initialTeachers;
}

export function saveTeachers(teachers: TeacherAccount[]): void {
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
}

export function loadCurrentUser(): User | null {
  return readJson<User | null>(SESSION_KEY, null);
}

export function saveCurrentUser(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  localStorage.removeItem(SESSION_KEY);
}