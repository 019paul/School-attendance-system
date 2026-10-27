import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  CircleHelp,
  GraduationCap,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Students } from "./pages/Students";
import { Attendance } from "./pages/Attendance";
import { History } from "./pages/History";
import { Reports } from "./pages/Reports";
import { Teachers } from "./pages/Teachers";
import { Login } from "./pages/Login";
import type { AttendanceRecord, PageName, Student, TeacherAccount, User } from "./types";
import {
  loadAttendance,
  loadCurrentUser,
  loadStudents,
  loadTeachers,
  saveAttendance,
  saveCurrentUser,
  saveStudents,
  saveTeachers,
} from "./utils/storage";
import { isSupabaseConfigured } from "./services/supabase";
import { signOut } from "./services/auth";

const pageDescriptions: Record<PageName, string> = {
  Dashboard: "School overview",
  Students: "Student directory",
  Classes: "Class directory",
  Teachers: "Teacher management & assignments",
  Attendance: "Daily attendance register",
  History: "Saved attendance records",
  Reports: "Attendance insights",
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => loadCurrentUser());
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [records, setRecords] = useState<AttendanceRecord[]>(() => loadAttendance());
  const [teachers, setTeachers] = useState<TeacherAccount[]>(() => loadTeachers());
  const [activePage, setActivePage] = useState<PageName>("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    saveStudents(students);
  }, [students]);

  useEffect(() => {
    saveAttendance(records);
  }, [records]);

  useEffect(() => {
    saveTeachers(teachers);
  }, [teachers]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }

  // --- Student Management (Admin) ---
  function addStudent(student: Omit<Student, "id">) {
    const newStudent: Student = {
      ...student,
      id: `stu-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setStudents((old) => [...old, newStudent]);
    notify(`${newStudent.name} was added.`);
  }

  function updateStudent(student: Student) {
    setStudents((old) =>
      old.map((item) => (item.id === student.id ? student : item))
    );
    setRecords((old) =>
      old.map((record) =>
        record.studentId === student.id
          ? { ...record, className: student.className }
          : record
      )
    );
    notify("Student details updated.");
  }

  function deleteStudent(id: string) {
    const student = students.find((item) => item.id === id);
    setStudents((old) => old.filter((item) => item.id !== id));
    notify(`${student?.name ?? "Student"} was deleted.`);
  }

  // --- Attendance Management ---
  function updateAttendance(nextRecords: AttendanceRecord[]) {
    setRecords(nextRecords);
    notify("Attendance register saved successfully.");
  }

  // --- Teacher Management (Admin) ---
  function handleAddTeacher(teacherData: Omit<TeacherAccount, "id" | "createdAt">) {
    const newTeacher: TeacherAccount = {
      ...teacherData,
      id: `tea-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setTeachers((old) => [...old, newTeacher]);
    notify(`Teacher account created for ${newTeacher.name}.`);
  }

  function handleUpdateTeacherClasses(teacherId: string, assignedClasses: string[]) {
    setTeachers((old) =>
      old.map((t) => (t.id === teacherId ? { ...t, assignedClasses } : t))
    );

    // If current logged-in user is this teacher, update session immediately
    if (currentUser && currentUser.id === teacherId) {
      const updatedUser = { ...currentUser, assignedClasses };
      setCurrentUser(updatedUser);
      saveCurrentUser(updatedUser);
    }
    notify("Teacher class assignments updated.");
  }

  function handleToggleTeacherStatus(teacherId: string) {
    setTeachers((old) =>
      old.map((t) => {
        if (t.id === teacherId) {
          const nextStatus = t.status === "active" ? "inactive" : "active";
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
    notify("Teacher account status changed.");
  }

  // --- Navigation Guard ---
  function handleNavigate(page: PageName) {
    if (currentUser?.role === "teacher") {
      const allowedTeacherPages: PageName[] = [
        "Dashboard",
        "Students",
        "Attendance",
        "History",
      ];
      if (!allowedTeacherPages.includes(page)) {
        notify("Access Restricted: That section is only available to School Administrators.");
        setActivePage("Dashboard");
        return;
      }
    }
    setActivePage(page);
  }

  // --- Authentication Handlers ---
  function handleLoginSuccess(user: User) {
    setCurrentUser(user);
    setActivePage("Dashboard");
    notify(`Welcome back, ${user.name}!`);
  }

  async function handleLogout() {
    await signOut();
    setCurrentUser(null);
    notify("You have safely signed out.");
  }

  // If user is not authenticated, render Login Page
  if (!currentUser) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        {toast && (
          <div className="toast-message" role="status">
            {toast}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        currentUser={currentUser}
      />

      <main className="main-area">
        {/* Subtle Demo Banner when Supabase is not yet configured */}
        {!isSupabaseConfigured && (
          <div className="demo-mode-banner">
            <div>
              <Sparkles size={13} style={{ display: "inline", marginRight: "6px" }} />
              <strong>Development Demo Mode:</strong> Using browser storage and pre-configured role profiles. Configure Supabase in <code>.env</code> for live PostgreSQL authentication.
            </div>
            <button
              onClick={() =>
                window.alert(
                  "Supabase Setup Instructions:\n\n1. Copy .env.example to .env\n2. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY\n3. Run the SQL schema in supabase/schema.sql in your Supabase SQL editor\n4. Restart the development server."
                )
              }
            >
              How to connect Supabase →
            </button>
          </div>
        )}

        <header className="topbar">
          <div className="breadcrumbs">
            <span>Greenfield Primary</span>
            <span className="crumb-separator">/</span>
            <strong>{pageDescriptions[activePage] || activePage}</strong>
          </div>

          <div className="topbar-actions">
            <button
              className="help-button"
              title="Project Information"
              onClick={() =>
                window.alert(
                  `ClassTrack Primary Attendance\nSigned in as: ${currentUser.name}\nRole: ${
                    currentUser.role === "admin"
                      ? "School Administrator (Full Access)"
                      : `Teacher (Assigned to: ${currentUser.assignedClasses.join(", ") || "None"})`
                  }\nAuth Backend: ${isSupabaseConfigured ? "Live Supabase Cloud" : "Local Demo Mock Mode"}`
                )
              }
            >
              <CircleHelp size={18} />
              <span>Help</span>
            </button>

            <button
              className="notification-button"
              aria-label="Notifications"
              onClick={() => notify("All attendance logs are up to date.")}
            >
              <Bell size={19} />
              <span />
            </button>

            {/* Profile Menu & Role Badge */}
            <div className="profile-menu">
              <div className="profile-avatar">
                {currentUser.role === "admin" ? (
                  <ShieldCheck size={19} />
                ) : (
                  <GraduationCap size={19} />
                )}
              </div>
              <div className="profile-copy">
                <strong>{currentUser.name}</strong>
                <span>
                  {currentUser.role === "admin"
                    ? "School Administrator"
                    : currentUser.assignedClasses.length > 0
                    ? `Teacher · ${currentUser.assignedClasses.join(", ")}`
                    : "Teacher (Unassigned)"}
                </span>
              </div>
              <ChevronDown size={16} className="profile-chevron" />
            </div>

            {/* Logout Button */}
            <button
              className="logout-button"
              title="Sign out of ClassTrack"
              onClick={handleLogout}
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Routing */}
        {activePage === "Dashboard" && (
          <Dashboard
            students={students}
            records={records}
            onNavigate={handleNavigate}
            currentUser={currentUser}
          />
        )}

        {activePage === "Students" && (
          <Students
            students={students}
            onAdd={addStudent}
            onUpdate={updateStudent}
            onDelete={deleteStudent}
            currentUser={currentUser}
          />
        )}

        {activePage === "Classes" && currentUser.role === "admin" && (
          <div className="page-content">
            <div className="page-heading">
              <div>
                <div className="eyebrow">SCHOOL STRUCTURE</div>
                <h1>Classes</h1>
                <p>View class groups, teacher assignments, and student counts.</p>
              </div>
            </div>
            <div className="class-cards">
              {[
                "Primary 1",
                "Primary 2",
                "Primary 3",
                "Primary 4",
                "Primary 5",
                "Primary 6",
              ].map((className, index) => {
                const count = students.filter(
                  (student) => student.className === className
                ).length;
                const assignedTeachers = teachers.filter((t) =>
                  t.assignedClasses.includes(className)
                );
                return (
                  <button
                    className="class-card"
                    key={className}
                    onClick={() => setActivePage("Students")}
                  >
                    <div className={`class-card-icon class-icon-${index + 1}`}>
                      <GraduationCap size={23} />
                    </div>
                    <strong>{className}</strong>
                    <span>
                      {count} student{count === 1 ? "" : "s"}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        color: assignedTeachers.length ? "#1f8a5b" : "#c06915",
                        marginTop: "4px",
                      }}
                    >
                      {assignedTeachers.length > 0
                        ? `Teacher: ${assignedTeachers.map((t) => t.name).join(", ")}`
                        : "No teacher assigned"}
                    </span>
                    <span className="class-card-link">View students →</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activePage === "Teachers" && currentUser.role === "admin" && (
          <Teachers
            teachers={teachers}
            onAddTeacher={handleAddTeacher}
            onUpdateClasses={handleUpdateTeacherClasses}
            onToggleStatus={handleToggleTeacherStatus}
          />
        )}

        {activePage === "Attendance" && (
          <Attendance
            students={students}
            records={records}
            onSave={updateAttendance}
            currentUser={currentUser}
          />
        )}

        {activePage === "History" && (
          <History
            records={records}
            students={students}
            currentUser={currentUser}
          />
        )}

        {activePage === "Reports" && currentUser.role === "admin" && (
          <Reports students={students} records={records} />
        )}

        <footer className="app-footer">
          <span>
            © {new Date().getFullYear()} ClassTrack · Greenfield Primary School
          </span>
          <span>
            {currentUser.role === "admin"
              ? "Administrator Portal"
              : "Teacher Attendance Register"}{" "}
            · Web Application
          </span>
        </footer>
      </main>

      {toast && (
        <div className="toast-message" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}