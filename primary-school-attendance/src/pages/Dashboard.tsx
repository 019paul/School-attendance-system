import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Users, UserX, AlertTriangle } from "lucide-react";
import type { AttendanceRecord, Student, User } from "../types";
import { formatDate, todayISO } from "../utils/storage";

interface DashboardProps {
  students: Student[];
  records: AttendanceRecord[];
  onNavigate: (page: "Students" | "Attendance" | "History" | "Reports") => void;
  currentUser: User;
}

export function Dashboard({ students, records, onNavigate, currentUser }: DashboardProps) {
  const isTeacher = currentUser.role === "teacher";
  const assignedClasses = isTeacher ? currentUser.assignedClasses : [
    "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6"
  ];

  // Scoped students and records
  const scopedStudents = isTeacher
    ? students.filter((s) => assignedClasses.includes(s.className))
    : students;
  const scopedRecords = isTeacher
    ? records.filter((r) => assignedClasses.includes(r.className))
    : records;

  const today = todayISO();
  const todaysRecords = scopedRecords.filter((record) => record.date === today);
  const present = todaysRecords.filter((record) => record.status === "Present" || record.status === "Late").length;
  const absent = todaysRecords.filter((record) => record.status === "Absent").length;
  const excused = todaysRecords.filter((record) => record.status === "Excused").length;
  const percentage = scopedStudents.length ? Math.round((present / scopedStudents.length) * 100) : 0;
  const hasAttendance = todaysRecords.length > 0;
  const latest = [...scopedRecords].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const studentMap = new Map(scopedStudents.map((student) => [student.id, student]));

  return (
    <div className="page-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            {isTeacher ? "TEACHER DASHBOARD" : "SCHOOL OVERVIEW"}
          </div>
          <h1>Good day, {currentUser.name} 👋</h1>
          <p>
            {isTeacher
              ? assignedClasses.length > 0
                ? `Managing attendance for ${assignedClasses.join(", ")}.`
                : "No classes have been assigned to your account yet."
              : "Here’s what’s happening across all classes at Greenfield Primary today."}
          </p>
        </div>
        <div className="today-chip">
          <CalendarDays size={17} />
          <span>
            {new Date().toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {isTeacher && assignedClasses.length === 0 && (
        <div
          className="info-note"
          style={{
            background: "#fff7eb",
            borderColor: "#fed7aa",
            color: "#9a3412",
            marginBottom: "24px",
            padding: "16px 20px",
          }}
        >
          <AlertTriangle size={20} style={{ color: "#ea580c" }} />
          <div>
            <strong style={{ color: "#9a3412", fontSize: "13px" }}>
              Action Required: No Classes Assigned Yet
            </strong>
            <p style={{ color: "#7c2d12", margin: "4px 0 0" }}>
              Your account has not been assigned to any primary classes. Please notify your School Administrator so they can assign your classes from the Teachers management portal.
            </p>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          icon={<Users size={20} />}
          label={isTeacher ? "Assigned students" : "Total students"}
          value={scopedStudents.length.toString()}
          note={isTeacher ? `In your ${assignedClasses.length} class(es)` : "Across all classes"}
          tone="green"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Present today"
          value={hasAttendance ? present.toString() : "—"}
          note={hasAttendance ? `${percentage}% attendance` : "Not recorded yet"}
          tone="blue"
        />
        <StatCard
          icon={<UserX size={20} />}
          label="Absent today"
          value={hasAttendance ? absent.toString() : "—"}
          note={hasAttendance ? `${excused} excused` : "Not recorded yet"}
          tone="orange"
        />
        <StatCard
          icon={<Clock3 size={20} />}
          label="Attendance rate"
          value={hasAttendance ? `${percentage}%` : "—"}
          note="Present and late count as present"
          tone="purple"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel attendance-cta">
          <div className="cta-icon"><ClipboardIcon /></div>
          <div className="eyebrow">DAILY REGISTER</div>
          <h2>Attendance starts here</h2>
          <p>
            {isTeacher && assignedClasses.length === 0
              ? "Attendance is locked until an administrator assigns classes to your account."
              : "Choose your assigned class, mark student attendance, and save today’s register."}
          </p>
          <button
            className="button button-primary"
            disabled={isTeacher && assignedClasses.length === 0}
            onClick={() => onNavigate("Attendance")}
          >
            Take attendance <ArrowRight size={17} />
          </button>
          <div className="cta-footer">
            <span className={`status-pip ${hasAttendance ? "pip-done" : ""}`} />
            {hasAttendance
              ? "Attendance has been recorded today"
              : "No attendance recorded for today"}
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>{isTeacher ? "Your assigned classes" : "Quick overview"}</h2>
              <p>Student distribution by class</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("Students")}>
              View students <ArrowRight size={15} />
            </button>
          </div>
          <div className="class-overview">
            {assignedClasses.length > 0 ? (
              assignedClasses.map((className, index) => {
                const count = scopedStudents.filter((s) => s.className === className).length;
                const colors = ["#1f8a5b", "#4e87db", "#e4a23c", "#8c70d6", "#df6e79", "#379fa3"];
                return (
                  <div className="class-line" key={className}>
                    <span
                      className="class-color"
                      style={{ background: colors[index % colors.length] }}
                    />
                    <span className="class-name">{className}</span>
                    <div className="mini-bar">
                      <span
                        style={{
                          width: `${scopedStudents.length ? (count / scopedStudents.length) * 100 : 0}%`,
                          background: colors[index % colors.length],
                        }}
                      />
                    </div>
                    <strong>{count}</strong>
                  </div>
                );
              })
            ) : (
              <p style={{ color: "#8a948c", fontSize: "11px", margin: "10px 0" }}>
                No assigned classes to display.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent attendance activity</h2>
            <p>
              {isTeacher
                ? "Latest records for your assigned classes"
                : "Latest saved student records across school"}
            </p>
          </div>
          <button className="text-button" onClick={() => onNavigate("History")}>
            View history <ArrowRight size={15} />
          </button>
        </div>
        {latest.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {latest.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="student-cell">
                        <span className="student-avatar">
                          {(studentMap.get(record.studentId)?.name ?? "S")
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <strong>{studentMap.get(record.studentId)?.name ?? "Removed student"}</strong>
                      </div>
                    </td>
                    <td>{record.className}</td>
                    <td>{formatDate(record.date)}</td>
                    <td><StatusBadge status={record.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Nothing recorded yet"
            description="Your latest attendance records will appear here after you save a register."
          />
        )}
      </section>
    </div>
  );
}

function ClipboardIcon() { return <CheckCircle2 size={24} />; }
function StatCard({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: string }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>;
}
export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><span />{status}</span>;
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><div className="empty-icon"><CalendarDays size={22} /></div><strong>{title}</strong><p>{description}</p></div>;
}