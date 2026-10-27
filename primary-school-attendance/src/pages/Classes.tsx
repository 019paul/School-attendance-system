import React, { useState } from "react";
import { Plus, GraduationCap, School, Users, UserCheck, Pencil, Search } from "lucide-react";
import type { SchoolClass, Student, TeacherAccount } from "../types";
import { Modal } from "../components/Modal";
import { EmptyState } from "./Dashboard";

interface ClassesProps {
  classes: SchoolClass[];
  students: Student[];
  teachers: TeacherAccount[];
  onAddClass: (newClass: Omit<SchoolClass, "id">) => void;
  onUpdateClass: (updatedClass: SchoolClass) => void;
  onSelectClassStudents: (className: string) => void;
  onNavigateToTeachers: () => void;
}

export function Classes({
  classes,
  students,
  teachers,
  onAddClass,
  onUpdateClass,
  onSelectClassStudents,
  onNavigateToTeachers,
}: ClassesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classNameInput, setClassNameInput] = useState("");
  const [gradeLevelInput, setGradeLevelInput] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleOpenAdd() {
    setEditingClass(null);
    setClassNameInput("");
    setGradeLevelInput(classes.length + 1);
    setErrorMessage("");
    setModalOpen(true);
  }

  function handleOpenEdit(cls: SchoolClass) {
    setEditingClass(cls);
    setClassNameInput(cls.name);
    setGradeLevelInput(cls.gradeLevel);
    setErrorMessage("");
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    const trimmed = classNameInput.trim();

    if (!trimmed) {
      setErrorMessage("Class name cannot be empty.");
      return;
    }

    const duplicate = classes.some(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        (!editingClass || c.id !== editingClass.id)
    );
    if (duplicate) {
      setErrorMessage(`A class named "${trimmed}" already exists.`);
      return;
    }

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        name: trimmed,
        gradeLevel: Number(gradeLevelInput),
      });
    } else {
      onAddClass({
        name: trimmed,
        gradeLevel: Number(gradeLevelInput),
      });
    }

    setModalOpen(false);
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">SCHOOL STRUCTURE</div>
          <h1>Classes & Class Groups</h1>
          <p>
            Configure classes, view student counts, and manage assigned teachers for this school.
          </p>
        </div>
        <button className="button button-primary" onClick={handleOpenAdd}>
          <Plus size={17} /> Add New Class
        </button>
      </div>

      <div className="summary-strip">
        <div className="summary-strip-icon">
          <School size={20} />
        </div>
        <div>
          <strong>{classes.length} Configured Classes</strong>
          <span>Single-school structure for Greenfield Primary</span>
        </div>
        <div className="summary-divider" />
        <div>
          <strong>{students.filter((s) => s.status === "active").length} Active Students</strong>
          <span>Enrolled across all classes</span>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search class by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="button button-secondary button-small" onClick={onNavigateToTeachers}>
            <UserCheck size={14} /> Teacher Assignments Portal
          </button>
        </div>

        {filteredClasses.length > 0 ? (
          <div style={{ padding: "20px 22px" }}>
            <div className="class-cards">
              {filteredClasses.map((cls, index) => {
                const enrolled = students.filter(
                  (s) => s.className === cls.name && s.status === "active"
                );
                const assignedTeachers = teachers.filter((t) =>
                  t.assignedClasses.includes(cls.name)
                );

                return (
                  <div className="class-card" key={cls.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        width: "100%",
                      }}
                    >
                      <div className={`class-card-icon class-icon-${(index % 6) + 1}`}>
                        <GraduationCap size={23} />
                      </div>
                      <button
                        className="icon-button"
                        title="Edit Class Name"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(cls);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                    </div>

                    <strong>{cls.name}</strong>
                    <span style={{ fontSize: "11px", color: "#617166", marginTop: "2px" }}>
                      Grade Level {cls.gradeLevel}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        color: "#47594d",
                        marginTop: "12px",
                      }}
                    >
                      <Users size={14} />
                      <strong>{enrolled.length}</strong> active student{enrolled.length === 1 ? "" : "s"}
                    </div>

                    <div
                      style={{
                        fontSize: "11px",
                        marginTop: "6px",
                        color: assignedTeachers.length ? "#19734b" : "#c06915",
                        fontWeight: 500,
                      }}
                    >
                      {assignedTeachers.length > 0 ? (
                        <span>
                          Teacher: {assignedTeachers.map((t) => t.name).join(", ")}
                        </span>
                      ) : (
                        <span>No teacher assigned</span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "16px",
                        width: "100%",
                      }}
                    >
                      <button
                        className="button button-secondary button-small"
                        style={{ flex: 1 }}
                        onClick={() => onSelectClassStudents(cls.name)}
                      >
                        View Students →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No classes found"
            description="No classes match your search query. Click 'Add New Class' to create one."
          />
        )}
      </section>

      {/* Add / Edit Class Modal */}
      {modalOpen && (
        <Modal
          title={editingClass ? "Edit Class" : "Add New Class"}
          subtitle="Configure school class structure and grade level."
          onClose={() => setModalOpen(false)}
        >
          <form className="form-body" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="login-error-banner">
                <span>{errorMessage}</span>
              </div>
            )}

            <label>
              Class Name
              <input
                autoFocus
                required
                placeholder="e.g. Primary 1 or Grade 1A"
                value={classNameInput}
                onChange={(e) => setClassNameInput(e.target.value)}
              />
            </label>

            <label>
              Grade Level
              <input
                type="number"
                required
                min={1}
                max={12}
                value={gradeLevelInput}
                onChange={(e) => setGradeLevelInput(Number(e.target.value))}
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
                {editingClass ? "Save Changes" : "Create Class"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
