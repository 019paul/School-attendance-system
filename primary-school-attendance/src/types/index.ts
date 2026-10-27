export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

export type UserRole = "admin" | "teacher";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedClasses: string[];
  status: "active" | "inactive";
  schoolName?: string;
}

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  assignedClasses: string[];
  status: "active" | "inactive";
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  gradeLevel: number;
}

export interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  status: "active" | "withdrawn";
  enrolledDate?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  className: string;
  date: string;
  status: AttendanceStatus;
}

export type PageName = "Dashboard" | "Students" | "Classes" | "Teachers" | "Attendance" | "History" | "Reports";