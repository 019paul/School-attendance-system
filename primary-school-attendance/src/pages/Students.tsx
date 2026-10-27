import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Phone,
  UserCheck,
} from "lucide-react";
import type { AttendanceRecord, SchoolClass, Student, User } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState } from "./Dashboard";

type StudentForm = Omit<Student, "id">;
const emptyForm: StudentForm = {
  name: "",
  admissionNumber: "",
  className: "Primary 1",
  guardianName: "",
  guardianPhone: "",
  status: "active",
  enrolledDate: new Date().toISOString().slice(0, 10),
};

export function Students({
  students,
  classes,
  records,
  onAdd,
  onUpdate,
  onDelete,
  currentUser,
  preselectedClass,
}: {
  students: Student[];
  classes: SchoolClass[];
  records: AttendanceRecord[];
  onAdd: (student: StudentForm) => void;
  onUpdate: (student: Student) => void;
  onDelete: (id: string) => void;
  currentUser: User;
  preselectedClass?: string;
}) {
  const isAdmin = currentUser.role === "admin";
  const classNames = classes.map((c) => c.name);
  const userPermittedClasses = isAdmin ? classNames : currentUser.assignedClasses;

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState(preselectedClass || "All classes");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "withdrawn">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);

  // Student Profile Modal State
  const [profileModalStudent, setProfileModalStudent] = useState<Student | null>(null);

  // Scoped students: teachers only see students belonging to their assigned classes
  const scopedStudents = useMemo(() => {
    if (isAdmin) return students;
    return students.filter((s) => userPermittedClasses.includes(s.className));
  }, [students, isAdmin, userPermittedClasses]);

  const filtered = useMemo(() => {
    return scopedStudents
      .filter((student) => {
        const matchesQuery =
          student.name.toLowerCase().includes(query.toLowerCase()) ||
          student.admissionNumber.toLowerCase().includes(query.toLowerCase()) ||
          student.guardianName.toLowerCase().includes(query.toLowerCase());
        const matchesClass =
          classFilter === "All classes" || student.className === classFilter;
        const matchesStatus =
          statusFilter === "all" || student.status === statusFilter;
        return matchesQuery && matchesClass && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [scopedStudents, query, classFilter, statusFilter]);

  function openAdd() {
    setEditing(null);
    const nextNum = students.length + 1;
    setForm({
      ...emptyForm,
      admissionNumber: `GPS-2026-${String(nextNum).padStart(3, "0")}`,
      className: userPermittedClasses[0] || "Primary 1",
    });
    setModalOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setForm({
      name: student.name,
      admissionNumber: student.admissionNumber,
      className: student.className,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      status: student.status,
      enrolledDate: student.enrolledDate || new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function handleToggleStatus(student: Student) {
    const nextStatus = student.status === "active" ? "withdrawn" : "active";
    const confirmMsg =
      nextStatus === "withdrawn"
        ? `Mark ${student.name} (${student.admissionNumber}) as Withdrawn? Their attendance history will be safely preserved.`
        : `Reactivate ${student.name}?`;
    if (window.confirm(confirmMsg)) {
      onUpdate({ ...student, status: nextStatus });
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = {
      name: form.name.trim(),
      admissionNumber: form.admissionNumber.trim(),
      className: form.className,
      guardianName: form.guardianName.trim(),
      guardianPhone: form.guardianPhone.trim(),
      status: form.status,
      enrolledDate: form.enrolledDate,
    };
    if (!clean.name || !clean.admissionNumber) return;

    if (editing) {
      onUpdate({ ...editing, ...clean });
    } else {
      onAdd(clean);
    }
    setModalOpen(false);
  }

  // Calculate stats for Profile Modal
  const profileStats = useMemo(() => {
    if (!profileModalStudent) return null;
    const stuRecords = records.filter((r) => r.studentId === profileModalStudent.id);
    const present = stuRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
    const absent = stuRecords.filter((r) => r.status === "Absent").length;
    const late = stuRecords.filter((r) => r.status === "Late").length;
    const excused = stuRecords.filter((r) => r.status === "Excused").length;
    const rate = stuRecords.length ? Math.round((present / stuRecords.length) * 100) : 0;
    return { total: stuRecords.length, present, absent, late, excused, rate };
  }, [profileModalStudent, records]);

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {isAdmin ? "SCHOOL DIRECTORY" : "CLASS DIRECTORY"}
          </div>
          <h1>Student Management</h1>
          <p>
            {isAdmin
              ? "Enrolled students at Greenfield Primary School. Search by name or admission number."
              : `Viewing enrolled students for your assigned classes: ${
                  userPermittedClasses.length > 0 ? userPermittedClasses.join(", ") : "None"
                }.`}
          </p>
        </div>
        {isAdmin && (
          <button className="button button-primary" onClick={openAdd}>
            <Plus size={17} /> Add New Student
          </button>
        )}
      </div>

      <div className="summary-strip">
        <div className="summary-strip-icon">
          <Users size={20} />
        </div>
        <div>
          <strong>{scopedStudents.filter((s) => s.status === "active").length} Active Students</strong>
          <span>
            {scopedStudents.filter((s) => s.status === "withdrawn").length} marked withdrawn · {scopedStudents.length} total in scope
          </span>
        </div>
        <div className="summary-divider" />
        <div>
          <strong>{userPermittedClasses.length} Classes Available</strong>
          <span>{isAdmin ? "Full school management" : "Teacher class view"}</span>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by student name or admission number (e.g. GPS-2026-001)..."
            />
          </div>
          <select
            aria-label="Filter by class"
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option>All classes</option>
            {userPermittedClasses.map((className) => (
              <option key={className}>{className}</option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as any)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="withdrawn">Withdrawn only</option>
          </select>
        </div>

        {userPermittedClasses.length === 0 ? (
          <EmptyState
            title="No classes assigned"
            description="You cannot view student records because you have not been assigned to any classes yet. Please ask an administrator to assign your classes."
          />
        ) : filtered.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Admission #</th>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Guardian</th>
                  <th>Contact</th>
                  <th className="actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <code style={{ fontSize: "11px", color: "#19734b", fontWeight: 700 }}>
                        {student.admissionNumber}
                      </code>
                    </td>
                    <td>
                      <div className="student-cell">
                        <span className="student-avatar">
                          {student.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <strong>{student.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="class-pill">{student.className}</span>
                    </td>
                    <td>
                      {student.status === "active" ? (
                        <span className="status-badge status-present">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="status-badge status-absent">
                          <XCircle size={12} /> Withdrawn
                        </span>
                      )}
                    </td>
                    <td>{student.guardianName || "—"}</td>
                    <td>{student.guardianPhone || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          title="View Student Profile & Attendance History"
                          aria-label={`View profile for ${student.name}`}
                          onClick={() => setProfileModalStudent(student)}
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="icon-button"
                              title="Edit Student Details"
                              aria-label={`Edit ${student.name}`}
                              onClick={() => openEdit(student)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="button button-small"
                              style={{
                                fontSize: "10px",
                                padding: "4px 8px",
                                background: student.status === "active" ? "#fbf5f5" : "#f1f8f3",
                                color: student.status === "active" ? "#9c3030" : "#19734b",
                                border: student.status === "active" ? "1px solid #fed7d7" : "1px solid #cce8d4",
                              }}
                              title={
                                student.status === "active"
                                  ? "Mark student as withdrawn (preserves history)"
                                  : "Reactivate student"
                              }
                              onClick={() => handleToggleStatus(student)}
                            >
                              {student.status === "active" ? "Withdraw" : "Reactivate"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No students found"
            description={
              isAdmin
                ? "Try changing your search, or click 'Add New Student' to register one."
                : "No students found matching your search within your assigned classes."
            }
          />
        )}
      </section>

      {/* Add / Edit Student Modal */}
      {isAdmin && modalOpen && (
        <Modal
          title={editing ? "Edit Student Details" : "Register New Student"}
          subtitle="Record student profile information for Greenfield Primary."
          onClose={() => setModalOpen(false)}
        >
          <form className="form-body" onSubmit={submit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>
                Admission Number
                <input
                  required
                  placeholder="e.g. GPS-2026-009"
                  value={form.admissionNumber}
                  onChange={(event) =>
                    setForm({ ...form, admissionNumber: event.target.value })
                  }
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as "active" | "withdrawn" })
                  }
                >
                  <option value="active">Active Enrolled</option>
                  <option value="withdrawn">Withdrawn / Inactive</option>
                </select>
              </label>
            </div>

            <label>
              Student Full Name
              <input
                autoFocus
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Ibrahim Danjuma"
              />
            </label>

            <label>
              Class Assignment
              <select
                value={form.className}
                onChange={(event) => setForm({ ...form, className: event.target.value })}
              >
                {classNames.map((className) => (
                  <option key={className}>{className}</option>
                ))}
              </select>
            </label>

            <label>
              Parent / Guardian Name
              <input
                value={form.guardianName}
                onChange={(event) =>
                  setForm({ ...form, guardianName: event.target.value })
                }
                placeholder="e.g. Mrs. Danjuma"
              />
            </label>

            <label>
              Guardian Phone Number
              <input
                type="tel"
                value={form.guardianPhone}
                onChange={(event) =>
                  setForm({ ...form, guardianPhone: event.target.value })
                }
                placeholder="e.g. 08012345678"
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary">
                {editing ? "Save Changes" : "Register Student"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Profile & History Modal */}
      {profileModalStudent && profileStats && (
        <Modal
          title={profileModalStudent.name}
          subtitle={`Admission: ${profileModalStudent.admissionNumber} · ${profileModalStudent.className}`}
          onClose={() => setProfileModalStudent(null)}
        >
          <div className="form-body">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                padding: "12px",
                background: "#f8faf8",
                borderRadius: "10px",
                border: "1px solid #e7ebe7",
              }}
            >
              <div>
                <span style={{ fontSize: "10px", color: "#8a948c", textTransform: "uppercase" }}>
                  Class
                </span>
                <strong style={{ display: "block", fontSize: "13px" }}>
                  {profileModalStudent.className}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "#8a948c", textTransform: "uppercase" }}>
                  Status
                </span>
                <strong style={{ display: "block", fontSize: "13px" }}>
                  {profileModalStudent.status === "active" ? "Active Enrolled" : "Withdrawn"}
                </strong>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "#8a948c", textTransform: "uppercase" }}>
                  Guardian
                </span>
                <span style={{ display: "block", fontSize: "12px" }}>
                  {profileModalStudent.guardianName || "Not provided"}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "#8a948c", textTransform: "uppercase" }}>
                  Contact
                </span>
                <span style={{ display: "block", fontSize: "12px" }}>
                  {profileModalStudent.guardianPhone || "Not provided"}
                </span>
              </div>
            </div>

            <h3 style={{ margin: "14px 0 6px", fontSize: "14px" }}>Attendance Record Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              <div className="stat-card" style={{ padding: "12px", textAlign: "center" }}>
                <div className="stat-label">Total Days</div>
                <div style={{ fontSize: "18px", fontWeight: 800 }}>{profileStats.total}</div>
              </div>
              <div className="stat-card" style={{ padding: "12px", textAlign: "center" }}>
                <div className="stat-label">Present/Late</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#19734b" }}>
                  {profileStats.present}
                </div>
              </div>
              <div className="stat-card" style={{ padding: "12px", textAlign: "center" }}>
                <div className="stat-label">Attendance Rate</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#2563eb" }}>
                  {profileStats.total ? `${profileStats.rate}%` : "—"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", fontSize: "11px", color: "#617166", marginTop: "8px" }}>
              <span>Absent: <strong>{profileStats.absent}</strong></span>
              <span>Late: <strong>{profileStats.late}</strong></span>
              <span>Excused: <strong>{profileStats.excused}</strong></span>
            </div>

            <div className="modal-actions" style={{ marginTop: "14px" }}>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setProfileModalStudent(null)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}