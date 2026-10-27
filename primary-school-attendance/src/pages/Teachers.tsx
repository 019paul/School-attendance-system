import React, { useState } from "react";
import {
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  Pencil,
  BookOpen,
  Search,
  ShieldAlert,
} from "lucide-react";
import type { TeacherAccount } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState } from "./Dashboard";

const ALL_CLASSES = [
  "Primary 1",
  "Primary 2",
  "Primary 3",
  "Primary 4",
  "Primary 5",
  "Primary 6",
];

interface TeachersProps {
  teachers: TeacherAccount[];
  onAddTeacher: (teacher: Omit<TeacherAccount, "id" | "createdAt">) => void;
  onUpdateClasses: (teacherId: string, assignedClasses: string[]) => void;
  onToggleStatus: (teacherId: string) => void;
}

export function Teachers({
  teachers,
  onAddTeacher,
  onUpdateClasses,
  onToggleStatus,
}: TeachersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteClasses, setInviteClasses] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState("");

  // Assign Classes Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAccount | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || teacher.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  function handleOpenAssignModal(teacher: TeacherAccount) {
    setSelectedTeacher(teacher);
    setSelectedClasses([...teacher.assignedClasses]);
    setAssignModalOpen(true);
  }

  function handleSaveClasses() {
    if (!selectedTeacher) return;
    onUpdateClasses(selectedTeacher.id, selectedClasses);
    setAssignModalOpen(false);
  }

  function toggleClassSelection(className: string) {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  }

  function toggleInviteClassSelection(className: string) {
    if (inviteClasses.includes(className)) {
      setInviteClasses(inviteClasses.filter((c) => c !== className));
    } else {
      setInviteClasses([...inviteClasses, className]);
    }
  }

  function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");

    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError("Name and email are required.");
      return;
    }

    if (teachers.some((t) => t.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      setInviteError("A teacher with this email already exists.");
      return;
    }

    onAddTeacher({
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      assignedClasses: inviteClasses,
      status: "active",
    });

    setInviteName("");
    setInviteEmail("");
    setInviteClasses([]);
    setInviteModalOpen(false);
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ADMINISTRATION</div>
          <h1>Teacher Management & Class Assignment</h1>
          <p>
            Create teacher accounts, assign specific classes, and manage active status.
          </p>
        </div>
        <button
          className="button button-primary"
          onClick={() => {
            setInviteError("");
            setInviteName("");
            setInviteEmail("");
            setInviteClasses([]);
            setInviteModalOpen(true);
          }}
        >
          <UserPlus size={17} /> Add New Teacher
        </button>
      </div>

      <div className="summary-strip">
        <div className="summary-strip-icon">
          <Users size={20} />
        </div>
        <div>
          <strong>{teachers.length} Teachers Registered</strong>
          <span>
            {teachers.filter((t) => t.status === "active").length} active ·{" "}
            {teachers.filter((t) => t.status === "inactive").length} deactivated
          </span>
        </div>
        <div className="summary-divider" />
        <div>
          <strong>Role-Based Access Guard</strong>
          <span>Teachers can only mark and view their assigned classes</span>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search teacher by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter teachers by status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Deactivated only</option>
          </select>
        </div>

        {filteredTeachers.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Email</th>
                  <th>Assigned Classes</th>
                  <th>Status</th>
                  <th className="actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>
                      <div className="student-cell">
                        <span className="student-avatar">
                          {teacher.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <strong>{teacher.name}</strong>
                          <div style={{ fontSize: "10px", color: "#89928b" }}>
                            Joined {teacher.createdAt}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{teacher.email}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {teacher.assignedClasses.length > 0 ? (
                          teacher.assignedClasses.map((cls) => (
                            <span key={cls} className="class-pill">
                              {cls}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: "11px", color: "#d58334" }}>
                            None assigned (restricted)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {teacher.status === "active" ? (
                        <span className="status-badge status-present">
                          <CheckCircle2 size={12} /> Active
                        </span>
                      ) : (
                        <span className="status-badge status-absent">
                          <XCircle size={12} /> Deactivated
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="button button-secondary button-small"
                          title="Assign or remove classes"
                          onClick={() => handleOpenAssignModal(teacher)}
                        >
                          <Pencil size={14} /> Assign Classes
                        </button>
                        <button
                          className={`button button-small ${
                            teacher.status === "active"
                              ? "button-secondary"
                              : "button-primary"
                          }`}
                          style={{
                            color: teacher.status === "active" ? "#c75151" : undefined,
                            borderColor: teacher.status === "active" ? "#f2d3d3" : undefined,
                          }}
                          onClick={() => onToggleStatus(teacher.id)}
                        >
                          {teacher.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No teachers found"
            description="Try modifying your search or click 'Add New Teacher' to invite someone."
          />
        )}
      </section>

      {/* Assign Classes Modal */}
      {assignModalOpen && selectedTeacher && (
        <Modal
          title={`Assign Classes: ${selectedTeacher.name}`}
          subtitle="Select which class registers this teacher is authorized to access."
          onClose={() => setAssignModalOpen(false)}
        >
          <div className="form-body">
            <p style={{ margin: 0, fontSize: "12px", color: "#616f65" }}>
              Teachers only see and record attendance for classes checked below:
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {ALL_CLASSES.map((cls) => {
                const checked = selectedClasses.includes(cls);
                return (
                  <label
                    key={cls}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px",
                      border: checked ? "1px solid #65a981" : "1px solid #e0e6e0",
                      background: checked ? "#f2f9f4" : "#fff",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleClassSelection(cls)}
                    />
                    <strong>{cls}</strong>
                  </label>
                );
              })}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleSaveClasses}
              >
                Save Class Assignments
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add New Teacher Modal */}
      {inviteModalOpen && (
        <Modal
          title="Add New Teacher"
          subtitle="Create a teacher account and assign their starting classes."
          onClose={() => setInviteModalOpen(false)}
        >
          <form className="form-body" onSubmit={handleInviteSubmit}>
            {inviteError && (
              <div className="login-error-banner">
                <ShieldAlert size={16} />
                <span>{inviteError}</span>
              </div>
            )}

            <label>
              Teacher Full Name
              <input
                required
                autoFocus
                placeholder="e.g. Mr. Emmanuel Okon"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </label>

            <label>
              School Email Address
              <input
                required
                type="email"
                placeholder="e.g. e.okon@greenfield.edu"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </label>

            <div>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#56635a", display: "block", marginBottom: "8px" }}>
                Assign Initial Classes
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {ALL_CLASSES.map((cls) => {
                  const checked = inviteClasses.includes(cls);
                  return (
                    <label
                      key={cls}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        border: checked ? "1px solid #65a981" : "1px solid #e0e6e0",
                        background: checked ? "#f2f9f4" : "#fff",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleInviteClassSelection(cls)}
                      />
                      <span>{cls}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="info-note" style={{ margin: "5px 0" }}>
              <BookOpen size={16} />
              <p>
                In demo mode, the default password for new teachers is{" "}
                <strong>TeacherPass123!</strong>. With Supabase connected, an official invite email is dispatched.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary">
                Create Teacher Account
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
