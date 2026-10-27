import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  Save,
  AlertTriangle,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { AttendanceRecord, AttendanceStatus, SchoolClass, Student, User } from "../types";
import { formatDate, todayISO } from "../utils/storage";
import { StatusBadge, EmptyState } from "./Dashboard";
import { Modal } from "../components/Modal";

const statuses: AttendanceStatus[] = ["Present", "Absent", "Late", "Excused"];
type Draft = Record<string, AttendanceStatus | undefined>;

export function Attendance({
  students,
  classes,
  records,
  onSave,
  currentUser,
}: {
  students: Student[];
  classes: SchoolClass[];
  records: AttendanceRecord[];
  onSave: (records: AttendanceRecord[]) => void;
  currentUser: User;
}) {
  const isAdmin = currentUser.role === "admin";
  const allClassNames = classes.map((c) => c.name);
  const permittedClasses = isAdmin ? allClassNames : currentUser.assignedClasses;

  const [className, setClassName] = useState<string>(permittedClasses[0] || "Primary 1");
  const [date, setDate] = useState(todayISO());
  const [draft, setDraft] = useState<Draft>({});
  const [isDirty, setIsDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Update selected class if permitted classes change
  useEffect(() => {
    if (permittedClasses.length > 0 && !permittedClasses.includes(className)) {
      setClassName(permittedClasses[0]);
    }
  }, [permittedClasses, className]);

  // Only active students in this class
  const classStudents = useMemo(
    () =>
      students
        .filter((student) => student.className === className && student.status === "active")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, className]
  );

  const existing = records.filter(
    (record) => record.className === className && record.date === date
  );
  const isSaved = existing.length > 0;

  useEffect(() => {
    const next: Draft = {};
    classStudents.forEach((student) => {
      const previous = existing.find((record) => record.studentId === student.id);
      next[student.id] = previous ? previous.status : undefined;
    });
    setDraft(next);
    setIsDirty(false);
    setMessage("");
  // Intentionally reset the draft when class/date or stored records change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className, date, students, records]);

  function handleClassChange(newClass: string) {
    if (isDirty) {
      if (!window.confirm("You have unsaved attendance changes. Discard and switch class?")) {
        return;
      }
    }
    setClassName(newClass);
  }

  function handleDateChange(newDate: string) {
    if (isDirty) {
      if (!window.confirm("You have unsaved attendance changes. Discard and change date?")) {
        return;
      }
    }
    setDate(newDate);
  }

  function updateStatus(studentId: string, status: AttendanceStatus) {
    setDraft((old) => ({ ...old, [studentId]: status }));
    setIsDirty(true);
    setMessage("");
  }

  function updateAll(status: AttendanceStatus) {
    const next: Draft = {};
    classStudents.forEach((student) => {
      next[student.id] = status;
    });
    setDraft(next);
    setIsDirty(true);
    setMessage("");
  }

  // Count unmarked
  const unmarkedCount = classStudents.filter((s) => !draft[s.id]).length;

  function handleRequestSave() {
    if (!permittedClasses.includes(className)) {
      setMessage("You do not have permission to record attendance for this class.");
      return;
    }
    if (!classStudents.length) {
      setMessage("Add students to this class before recording attendance.");
      return;
    }
    if (unmarkedCount > 0) {
      setMessage(`Please mark all students. There are ${unmarkedCount} unmarked student(s).`);
      return;
    }
    setConfirmModalOpen(true);
  }

  function executeSave() {
    const otherRecords = records.filter(
      (record) => !(record.className === className && record.date === date)
    );
    const newRecords: AttendanceRecord[] = classStudents.map((student) => ({
      id: `${date}-${student.id}`,
      studentId: student.id,
      className,
      date,
      status: (draft[student.id] as AttendanceStatus) || "Present",
    }));

    onSave([...otherRecords, ...newRecords]);
    setIsDirty(false);
    setConfirmModalOpen(false);
    setMessage(`Attendance register submitted successfully for ${className} on ${formatDate(date)}.`);
  }

  const counts = statuses.map((status) => ({
    status,
    count: classStudents.filter((student) => draft[student.id] === status).length,
  }));

  if (permittedClasses.length === 0) {
    return (
      <div className="page-content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">DAILY REGISTER</div>
            <h1>Take Attendance</h1>
            <p>Record and review attendance for your assigned classes.</p>
          </div>
        </div>

        <div
          className="panel"
          style={{
            padding: "45px 24px",
            textAlign: "center",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "15px",
              background: "#fff1e3",
              color: "#d58334",
              display: "grid",
              placeItems: "center",
              marginBottom: "16px",
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: "19px" }}>
            No Assigned Classes
          </h2>
          <p
            style={{
              color: "#8a948c",
              fontSize: "12px",
              maxWidth: "440px",
              lineHeight: 1.6,
              margin: "0 0 20px",
            }}
          >
            Your teacher account has not been assigned to any classes yet. Attendance registers are locked until an administrator assigns classes to you.
          </p>
          <div className="info-note" style={{ maxWidth: "480px", textAlign: "left" }}>
            <ClipboardCheck size={18} />
            <p>
              Please ask your <strong>School Administrator</strong> to assign your classes in the <strong>Teachers</strong> section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">DAILY REGISTER</div>
          <h1>Daily Attendance Register</h1>
          <p>
            {isAdmin
              ? "Recording attendance across all school classes."
              : `Authorized for: ${permittedClasses.join(", ")}`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isDirty && (
            <span
              style={{
                fontSize: "11px",
                color: "#c06915",
                background: "#fef8ee",
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #fedfa7",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <AlertCircle size={13} /> Unsaved changes
            </span>
          )}
          <div className="saved-indicator">
            <span className={`status-pip ${isSaved ? "pip-done" : ""}`} />
            {isSaved ? "Saved register" : "New register"}
          </div>
        </div>
      </div>

      <section className="panel attendance-controls">
        <div className="control-field">
          <label htmlFor="attendance-class">Select class</label>
          <select
            id="attendance-class"
            value={className}
            onChange={(event) => handleClassChange(event.target.value)}
          >
            {permittedClasses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="control-field">
          <label htmlFor="attendance-date">Attendance date</label>
          <div className="date-input">
            <CalendarDays size={17} />
            <input
              id="attendance-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(event) => handleDateChange(event.target.value)}
            />
          </div>
        </div>
        <div className="attendance-count">
          <strong>{classStudents.length}</strong>
          <span>Active Students in Class</span>
        </div>
      </section>

      <section className="panel attendance-panel">
        <div className="panel-heading">
          <div>
            <h2>Student Register</h2>
            <p>
              {className} · {formatDate(date)}
            </p>
          </div>
          <button
            className="button button-secondary button-small"
            onClick={() => updateAll("Present")}
          >
            <CheckCheck size={16} /> Mark all present
          </button>
        </div>

        {/* Category Counts & Unmarked Warning */}
        <div className="status-summary">
          {counts.map(({ status, count }) => (
            <div className="status-summary-item" key={status}>
              <StatusBadge status={status} />
              <strong>{count}</strong>
            </div>
          ))}
          {unmarkedCount > 0 && (
            <div
              className="status-summary-item"
              style={{
                background: "#fff6f6",
                borderColor: "#fecaca",
                color: "#b91c1c",
              }}
            >
              <HelpCircle size={14} />
              <span>Unmarked:</span>
              <strong>{unmarkedCount}</strong>
            </div>
          )}
        </div>

        {unmarkedCount > 0 && (
          <div
            style={{
              padding: "10px 22px",
              background: "#fff9f2",
              borderBottom: "1px solid #fee6cc",
              fontSize: "11px",
              color: "#9a3412",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={15} style={{ color: "#ea580c" }} />
            <span>
              Please select an attendance status for all students before submitting.
            </span>
          </div>
        )}

        {classStudents.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student Details</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map((student) => {
                  const currentStatus = draft[student.id];
                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="student-cell">
                          <span className="student-avatar">
                            {student.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div>
                            <strong>{student.name}</strong>
                            <div style={{ fontSize: "10px", color: "#89928b" }}>
                              {student.admissionNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="attendance-options">
                          {statuses.map((status) => (
                            <button
                              key={status}
                              className={`attendance-option option-${status.toLowerCase()} ${
                                currentStatus === status ? "option-selected" : ""
                              }`}
                              onClick={() => updateStatus(student.id, status)}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No active students in this class"
            description="Add or enroll students into this class from the Students page before taking attendance."
          />
        )}

        <div className="attendance-footer">
          {message && (
            <p
              className={`inline-message ${
                message.startsWith("Attendance register submitted")
                  ? "message-success"
                  : "message-error"
              }`}
            >
              {message}
            </p>
          )}
          <div className="footer-spacer" />
          <button
            className="button button-primary"
            onClick={handleRequestSave}
            disabled={!classStudents.length}
          >
            <Save size={17} /> {isSaved ? "Review & Update Register" : "Submit Attendance"}
          </button>
        </div>
      </section>

      <div className="info-note">
        <ClipboardCheck size={18} />
        <p>
          <strong>Notice:</strong> Submitting updates the official register for <strong>{className}</strong> on <strong>{formatDate(date)}</strong>. Only authorized staff may make subsequent corrections.
        </p>
      </div>

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <Modal
          title="Confirm Attendance Submission"
          subtitle={`Verify today's counts for ${className} on ${formatDate(date)}`}
          onClose={() => setConfirmModalOpen(false)}
        >
          <div className="form-body">
            <p style={{ margin: 0, fontSize: "12px", color: "#47594d" }}>
              You are about to save the attendance register with the following totals:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                padding: "14px",
                background: "#f8faf8",
                borderRadius: "10px",
                border: "1px solid #e7ebe7",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "#7a877e" }}>Total Students</span>
                <strong style={{ display: "block", fontSize: "16px" }}>{classStudents.length}</strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#19734b" }}>Present</span>
                <strong style={{ display: "block", fontSize: "16px", color: "#19734b" }}>
                  {counts.find((c) => c.status === "Present")?.count || 0}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#c75151" }}>Absent</span>
                <strong style={{ display: "block", fontSize: "16px", color: "#c75151" }}>
                  {counts.find((c) => c.status === "Absent")?.count || 0}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#bd7a21" }}>Late / Excused</span>
                <strong style={{ display: "block", fontSize: "16px", color: "#bd7a21" }}>
                  {(counts.find((c) => c.status === "Late")?.count || 0) +
                    (counts.find((c) => c.status === "Excused")?.count || 0)}
                </strong>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "12px" }}>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setConfirmModalOpen(false)}
              >
                Go Back & Review
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={executeSave}
              >
                <CheckCircle2 size={16} /> Confirm & Save
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}