import { useMemo, useState } from "react";
import { Download, Search, Calendar } from "lucide-react";
import type { AttendanceRecord, SchoolClass, Student, User } from "../types";
import { formatDate } from "../utils/storage";
import { EmptyState, StatusBadge } from "./Dashboard";

export function History({
  records,
  students,
  classes,
  currentUser,
}: {
  records: AttendanceRecord[];
  students: Student[];
  classes: SchoolClass[];
  currentUser: User;
}) {
  const isAdmin = currentUser.role === "admin";
  const allClassNames = classes.map((c) => c.name);
  const userPermittedClasses = isAdmin ? allClassNames : currentUser.assignedClasses;

  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All classes");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  );

  // Scoped records: teachers can only view records for their assigned classes
  const scopedRecords = useMemo(() => {
    if (isAdmin) return records;
    return records.filter((r) => userPermittedClasses.includes(r.className));
  }, [records, isAdmin, userPermittedClasses]);

  const filtered = useMemo(() => {
    return scopedRecords
      .filter((record) => {
        const student = studentMap.get(record.studentId);
        const name = student?.name ?? "Removed student";
        const admission = student?.admissionNumber ?? "";

        const matchesQuery =
          name.toLowerCase().includes(query.toLowerCase()) ||
          admission.toLowerCase().includes(query.toLowerCase());
        const matchesClass =
          classFilter === "All classes" || record.className === classFilter;
        const matchesStatus =
          statusFilter === "All statuses" || record.status === statusFilter;

        let matchesDate = true;
        if (startDate && record.date < startDate) matchesDate = false;
        if (endDate && record.date > endDate) matchesDate = false;

        return matchesQuery && matchesClass && matchesStatus && matchesDate;
      })
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          (studentMap.get(a.studentId)?.name ?? "").localeCompare(
            studentMap.get(b.studentId)?.name ?? ""
          )
      );
  }, [scopedRecords, query, classFilter, statusFilter, startDate, endDate, studentMap]);

  function exportCsv() {
    const rows = [
      ["Admission Number", "Student Name", "Class", "Date", "Status"],
      ...filtered.map((record) => {
        const student = studentMap.get(record.studentId);
        return [
          student?.admissionNumber ?? "—",
          student?.name ?? "Removed student",
          record.className,
          record.date,
          record.status,
        ];
      }),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleResetFilters() {
    setQuery("");
    setClassFilter("All classes");
    setStatusFilter("All statuses");
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {isAdmin ? "SCHOOL RECORDS" : "CLASS RECORDS"}
          </div>
          <h1>Attendance History & Register Log</h1>
          <p>
            {isAdmin
              ? "Comprehensive attendance audit trail across all school classes."
              : `Reviewing saved records for: ${
                  userPermittedClasses.length > 0 ? userPermittedClasses.join(", ") : "No classes assigned"
                }.`}
          </p>
        </div>
        <button
          className="button button-secondary"
          onClick={exportCsv}
          disabled={!filtered.length}
        >
          <Download size={17} /> Export Filtered CSV
        </button>
      </div>

      <section className="panel">
        <div className="toolbar history-toolbar" style={{ gap: "10px" }}>
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by student name or admission number..."
            />
          </div>

          <select
            aria-label="Filter by class"
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
          >
            <option>All classes</option>
            {userPermittedClasses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option>All statuses</option>
            {["Present", "Absent", "Late", "Excused"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "#6e7c72" }}>From:</span>
            <input
              aria-label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "#6e7c72" }}>To:</span>
            <input
              aria-label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {(query || classFilter !== "All classes" || statusFilter !== "All statuses" || startDate || endDate) && (
            <button
              className="text-button"
              style={{ padding: "0 6px", fontSize: "11px" }}
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>

        {userPermittedClasses.length === 0 ? (
          <EmptyState
            title="No assigned classes"
            description="You do not have access to any class records until an administrator assigns classes to your account."
          />
        ) : (
          <>
            <div className="history-count">
              Found <strong>{filtered.length}</strong> attendance record{filtered.length === 1 ? "" : "s"}
            </div>

            {filtered.length ? (
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
                    {filtered.map((record) => {
                      const student = studentMap.get(record.studentId);
                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="student-cell">
                              <span className="student-avatar">
                                {(student?.name ?? "R")
                                  .split(" ")
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")}
                              </span>
                              <div>
                                <strong>{student?.name ?? "Removed student"}</strong>
                                <div style={{ fontSize: "10px", color: "#8a948c" }}>
                                  {student?.admissionNumber || "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="class-pill">{record.className}</span>
                          </td>
                          <td>{formatDate(record.date)}</td>
                          <td>
                            <StatusBadge status={record.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No attendance records match your filter"
                description="Try clearing or broadening your date range or search terms."
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}